# ── Alerts ───────────────────────────────────────────────────────────────
#
# Three alarms mail `alert_email` when something breaks, and again when it
# has stayed fixed for an hour. Each looks at the last twelve five-minute
# periods and goes off on the first bad one, so a run of errors sends one
# mail rather than one per error.
#
# An alarm can only notify a topic in its own region, and CloudFront's
# metrics live in us-east-1, so the topic and its subscription exist in both.
# AWS mails a confirmation link to the address for each; nothing is delivered
# until it is clicked.

locals {
  alarm_window = {
    datapoints_to_alarm = 1
    evaluation_periods  = 12
    period              = 300
  }
}

resource "aws_sns_topic" "alerts" {
  name = "blog-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  endpoint  = var.alert_email
  protocol  = "email"
  topic_arn = aws_sns_topic.alerts.arn
}

resource "aws_sns_topic" "alerts_us_east_1" {
  provider = aws.us_east_1
  name     = "blog-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email_us_east_1" {
  provider  = aws.us_east_1
  endpoint  = var.alert_email
  protocol  = "email"
  topic_arn = aws_sns_topic.alerts_us_east_1.arn
}

# A crash, a timeout or a failed start. A page that renders an error still
# returns from the function successfully, so it is not counted here.
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_actions       = [aws_sns_topic.alerts.arn]
  alarm_description   = "The blog's Lambda function failed to run."
  alarm_name          = "blog-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = local.alarm_window.datapoints_to_alarm
  dimensions          = { FunctionName = aws_lambda_function.blog.function_name }
  evaluation_periods  = local.alarm_window.evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  ok_actions          = [aws_sns_topic.alerts.arn]
  period              = local.alarm_window.period
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
}

# What readers actually got. 4xx is left out: a mistyped URL is not a fault.
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  provider            = aws.us_east_1
  alarm_actions       = [aws_sns_topic.alerts_us_east_1.arn]
  alarm_description   = "More than 5% of the blog's responses were 5xx."
  alarm_name          = "blog-cloudfront-5xx"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = local.alarm_window.datapoints_to_alarm
  dimensions = {
    DistributionId = aws_cloudfront_distribution.blog.id
    Region         = "Global"
  }
  evaluation_periods = local.alarm_window.evaluation_periods
  metric_name        = "5xxErrorRate"
  namespace          = "AWS/CloudFront"
  ok_actions         = [aws_sns_topic.alerts_us_east_1.arn]
  period             = local.alarm_window.period
  statistic          = "Average"
  threshold          = 5
  treat_missing_data = "notBreaching"
}

# Errors the app caught and logged, which the two alarms above never see:
# `⨯` is how Next.js prefixes a server error, and the rest are the messages
# the app's own `console.error` and `console.warn` calls write.
resource "aws_cloudwatch_log_metric_filter" "app_errors" {
  log_group_name = aws_cloudwatch_log_group.lambda.name
  name           = "blog-app-errors"
  pattern        = "?\"⨯\" ?\"] failed\" ?\"fetch failed\" ?\"fetch error:\" ?\"API error:\" ?\"is not set\""

  metric_transformation {
    name      = "AppErrors"
    namespace = "Blog"
    unit      = "Count"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_actions       = [aws_sns_topic.alerts.arn]
  alarm_description   = "The blog logged an error. Its log group is /aws/lambda/blog."
  alarm_name          = "blog-app-errors"
  comparison_operator = "GreaterThanThreshold"
  datapoints_to_alarm = local.alarm_window.datapoints_to_alarm
  evaluation_periods  = local.alarm_window.evaluation_periods
  metric_name         = aws_cloudwatch_log_metric_filter.app_errors.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.app_errors.metric_transformation[0].namespace
  ok_actions          = [aws_sns_topic.alerts.arn]
  period              = local.alarm_window.period
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
}
