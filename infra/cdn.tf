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

    # Both are AWS-managed, so there is nothing of ours to import for them.
    # Looked up by name: the IDs are the same in every account, but a UUID in
    # the file says nothing about what it selects.
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
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

# CachingDisabled, so the distribution holds nothing and every request reaches
# the function. It overrides the origin's own `s-maxage`, which the app does
# send. Recorded as it stands; changing it is a change, not an import.
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}
