# Every resource here already exists. This file is what brings the running
# account under management; nothing in it creates anything.
#
# NS and SOA are deliberately absent. Route 53 writes both when it creates a
# zone and `aws_route53_zone` reports them as attributes, so importing them as
# records buys nothing and gives a future plan something to argue with.


import {
  to = aws_ecr_repository.blog
  id = "blog"
}

import {
  to = aws_ecr_lifecycle_policy.blog
  id = "blog"
}

import {
  to = aws_dynamodb_table.page_views
  id = "blog-page-views"
}

import {
  to = aws_cloudwatch_log_group.lambda
  id = "/aws/lambda/blog"
}

import {
  to = aws_lambda_function.blog
  id = "blog"
}

import {
  to = aws_lambda_function_url.blog
  id = "blog"
}

# Three statements sit on the function's resource policy. The first and the
# third say the same thing under different Sids.
import {
  to = aws_lambda_permission.function_url_public_access
  id = "blog/FunctionURLAllowPublicAccess"
}

import {
  to = aws_lambda_permission.function_url_invoke
  id = "blog/FunctionURLAllowInvokeFunction"
}

import {
  to = aws_lambda_permission.cloudfront
  id = "blog/AllowCloudFrontServicePrincipal"
}

import {
  to = aws_iam_role.lambda_exec
  id = "blog-role-5p8437k8"
}

import {
  to = aws_iam_role_policy.lambda_exec_page_views
  id = "blog-role-5p8437k8:blog-page-views-access"
}

import {
  to = aws_iam_policy.lambda_basic_execution
  id = "arn:aws:iam::647089171678:policy/service-role/AWSLambdaBasicExecutionRole-f205ec3b-503f-4ca6-a7af-89cce5ecd960"
}

import {
  to = aws_iam_role_policy_attachment.lambda_basic_execution
  id = "blog-role-5p8437k8/arn:aws:iam::647089171678:policy/service-role/AWSLambdaBasicExecutionRole-f205ec3b-503f-4ca6-a7af-89cce5ecd960"
}

import {
  to = aws_iam_openid_connect_provider.github
  id = "arn:aws:iam::647089171678:oidc-provider/token.actions.githubusercontent.com"
}

import {
  to = aws_iam_role.github_actions
  id = "github-actions-blog-lambda"
}

import {
  to = aws_iam_role_policy.github_actions_deploy
  id = "github-actions-blog-lambda:lambda-deploy"
}

import {
  to = aws_cloudfront_distribution.blog
  id = "E1XBVQIWEULOGL"
}

import {
  provider = aws.us_east_1
  to       = aws_acm_certificate.blog
  id       = "arn:aws:acm:us-east-1:647089171678:certificate/c8774519-2f85-47f0-9a37-c170318965fd"
}

import {
  to = aws_route53_zone.blog
  id = "Z05913233HM04NTDQJT9V"
}

import {
  to = aws_route53_record.apex_a
  id = "Z05913233HM04NTDQJT9V_kokohore56562wanwan.site_A"
}

import {
  to = aws_route53_record.apex_aaaa
  id = "Z05913233HM04NTDQJT9V_kokohore56562wanwan.site_AAAA"
}

import {
  to = aws_route53_record.acm_validation["kokohore56562wanwan.site"]
  id = "Z05913233HM04NTDQJT9V__cce001b0044e1dd5feba8866a357a3d2.kokohore56562wanwan.site_CNAME"
}

import {
  to = aws_route53_record.dmarc
  id = "Z05913233HM04NTDQJT9V__dmarc.kokohore56562wanwan.site_TXT"
}

import {
  to = aws_cloudfront_origin_access_control.blog
  id = "E4T80ZQVPBL7Q"
}

import {
  to = aws_iam_role.tofu_plan
  id = "github-actions-blog-tofu-plan"
}

import {
  to = aws_iam_role_policy_attachment.tofu_plan_read_only
  id = "github-actions-blog-tofu-plan/arn:aws:iam::aws:policy/ReadOnlyAccess"
}

import {
  to = aws_iam_role.tofu_apply
  id = "github-actions-blog-tofu-apply"
}

import {
  to = aws_iam_role_policy_attachment.tofu_apply_power_user
  id = "github-actions-blog-tofu-apply/arn:aws:iam::aws:policy/PowerUserAccess"
}

import {
  to = aws_iam_role_policy.tofu_apply_iam
  id = "github-actions-blog-tofu-apply:tofu-iam"
}
