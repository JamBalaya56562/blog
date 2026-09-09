resource "aws_cloudfront_origin_access_control" "blog" {
  name = "blog"
  # Left empty deliberately: the provider writes "Managed by Terraform" when
  # this is unset, and the live control has no description.
  description                       = ""
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "blog" {
  aliases         = [var.domain_name]
  enabled         = true
  http_version    = "http2and3"
  is_ipv6_enabled = true
  price_class     = "PriceClass_200"

  origin {
    # The function URL is a full URL and an origin wants a bare host, so the
    # scheme and the trailing slash come off. Read from the resource rather
    # than pasted, because the host is generated when the URL is created.
    domain_name              = trimsuffix(trimprefix(aws_lambda_function_url.blog.function_url, "https://"), "/")
    origin_id                = "blog"
    origin_access_control_id = aws_cloudfront_origin_access_control.blog.id
    connection_attempts      = 3
    connection_timeout       = 10

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 5
      origin_read_timeout      = 30
    }
  }

  default_cache_behavior {
    target_origin_id       = "blog"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id = aws_cloudfront_cache_policy.blog.id
    # AWS-managed, so there is nothing of ours to import for it. Looked up by
    # name: the ID is the same in every account, but a UUID in the file says
    # nothing about what it selects.
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.blog.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# Host is dropped from the forwarded headers because the origin is a Lambda
# function URL, which rejects a Host that is not its own.
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

/**
 * The distribution used to run `Managed-CachingDisabled`, which held nothing:
 * every request reached the function and the `s-maxage=900` the app takes the
 * trouble to send was thrown away.
 *
 * No managed policy replaces it, because the cache key this app needs is not
 * one of the shapes AWS ships. Three findings decided its contents, each
 * measured against the running site rather than assumed.
 *
 * `Vary` does nothing here. CloudFront's cache key is the distribution domain,
 * the path, and whatever this policy names — the origin's `Vary` header is
 * never consulted. `proxy.ts` sends `Vary: Accept-Language` on its redirect and
 * that is correct for browsers, but a CDN that ignored it would serve one
 * reader's language to everyone.
 *
 * Query strings carry the RSC variants. Next answers an RSC request with a
 * redirect to the same path plus `_rsc=<hash>`, and the hash differs for every
 * combination of RSC headers — prefetch, segment prefetch and the router state
 * tree all produce their own. Keying on the whole query string therefore
 * separates them without naming any of them, which is why
 * `next-router-state-tree`, whose value is different on nearly every
 * navigation, is deliberately absent below.
 *
 * The `rsc` header still has to be named. At one fixed hashed URL the response
 * is 70,001 bytes of `text/x-component` with the header and 129,451 bytes of
 * `text/html` without it, and both carry `s-maxage=900`. Left out of the key,
 * whichever arrived first would be served to the other — HTML to the router, or
 * a payload to a browser. `next-router-prefetch` behaves the same way.
 */
resource "aws_cloudfront_cache_policy" "blog" {
  name    = "blog"
  comment = "Next.js on a Lambda function URL: origin decides TTLs, RSC variants stay separate"

  # Zero defaults, a one-year ceiling: the origin's Cache-Control decides. That
  # is what keeps the locale redirect out of the cache — it carries no
  # Cache-Control at all, so it is never stored, and the Accept-Language
  # question never arises.
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    cookies_config {
      cookie_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["rsc", "next-router-prefetch", "next-router-segment-prefetch"]
      }
    }
  }
}
