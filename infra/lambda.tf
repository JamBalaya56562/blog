resource "aws_lambda_function" "blog" {
  architectures = ["arm64"]
  function_name = "blog"
  memory_size   = 1024
  package_type  = "Image"
  role          = aws_iam_role.lambda_exec.arn
  timeout       = 10

  # Deploys come from .github/workflows/lambda.yml, which pushes a new tag and
  # points the function at it. OpenTofu would otherwise pull the function back
  # to whatever tag was current when this file was last written.
  image_uri = "${aws_ecr_repository.blog.repository_url}:e58965131889a24b7d19c96fc3b9766155276163"

  lifecycle {
    ignore_changes = [image_uri]
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.page_views.name
    }
  }

  ephemeral_storage {
    size = 512
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda.name
  }

  tracing_config {
    mode = "PassThrough"
  }
}

resource "aws_lambda_function_url" "blog" {
  authorization_type = "NONE"
  function_name      = aws_lambda_function.blog.function_name
  invoke_mode        = "RESPONSE_STREAM"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/blog"
  retention_in_days = 30
}

# Three statements sit on the function's resource policy. The first and the
# third are the same rule under different names — one of them is redundant, and
# removing it is a change rather than an import, so both are recorded here as
# they stand.
resource "aws_lambda_permission" "function_url_public_access" {
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.blog.function_name
  function_url_auth_type = "NONE"
  principal              = "*"
  statement_id           = "FunctionURLAllowPublicAccess"
}

resource "aws_lambda_permission" "function_url_invoke" {
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.blog.function_name
  function_url_auth_type = "NONE"
  principal              = "*"
  statement_id           = "FunctionURLAllowInvokeFunction"
}

resource "aws_lambda_permission" "cloudfront" {
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.blog.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.blog.arn
  statement_id  = "AllowCloudFrontServicePrincipal"
}
