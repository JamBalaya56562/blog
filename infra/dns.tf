# CloudFront serves from us-east-1's certificate store no matter where the rest
# of the stack lives, which is the only reason this file needs a second
# provider.
resource "aws_acm_certificate" "blog" {
  provider = aws.us_east_1

  domain_name       = var.domain_name
  key_algorithm     = "EC_prime256v1"
  validation_method = "DNS"

  options {
    certificate_transparency_logging_preference = "ENABLED"
    export                                      = "DISABLED"
  }
}

resource "aws_route53_zone" "blog" {
  name    = var.domain_name
  comment = "The blog domain"
}

resource "aws_route53_record" "apex_a" {
  zone_id = aws_route53_zone.blog.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.blog.domain_name
    zone_id                = aws_cloudfront_distribution.blog.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "apex_aaaa" {
  zone_id = aws_route53_zone.blog.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.blog.domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

# The name and target of this record are not ours to choose — ACM decides them
# and publishes them on the certificate, so they are read from there rather
# than copied. Deleting the record stops the certificate renewing, and the
# failure surfaces months later as an expired certificate rather than as
# anything here.
#
# `for_each` over one domain looks like overkill, but it is what makes this
# work unchanged for a certificate covering several names.
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for option in aws_acm_certificate.blog.domain_validation_options :
    option.domain_name => option
  }

  zone_id = aws_route53_zone.blog.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  ttl     = 300
  records = [each.value.resource_record_value]
}

# The domain sends no mail. `p=none` is what SES left behind rather than a
# considered policy.
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.blog.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
}
