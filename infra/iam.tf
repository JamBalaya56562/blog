# ── The function's own role ──────────────────────────────────────────────
#
# The name and the `/service-role/` path are what the console gave it when the
# function was created by hand. Both are recorded rather than tidied: renaming
# a role means destroying and recreating it, which is not what an import is
# for.

resource "aws_iam_role" "lambda_exec" {
  name = "blog-role-5p8437k8"
  path = "/service-role/"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy" "lambda_exec_page_views" {
  name = "blog-page-views-access"
  role = aws_iam_role.lambda_exec.name

  policy = jsonencode({
    Statement = [{
      Action   = ["dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:UpdateItem"]
      Effect   = "Allow"
      Resource = aws_dynamodb_table.page_views.arn
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_policy" "lambda_basic_execution" {
  name = "AWSLambdaBasicExecutionRole-f205ec3b-503f-4ca6-a7af-89cce5ecd960"
  path = "/service-role/"

  policy = jsonencode({
    Statement = [{
      Action   = "logs:CreateLogGroup"
      Effect   = "Allow"
      Resource = "arn:aws:logs:ap-northeast-1:647089171678:*"
      }, {
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Effect   = "Allow"
      Resource = ["arn:aws:logs:ap-northeast-1:647089171678:log-group:/aws/lambda/blog:*"]
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_basic_execution.arn
}

# ── The deploy identity ──────────────────────────────────────────────────
#
# GitHub Actions assumes this through OIDC. No access key exists for it, and
# the trust policy is what makes that possible.

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["ab9d0263244dd0326eb67015705a667e79cfe998"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-blog-lambda"

  # `sub` is pinned to one branch of one repository. Without that condition the
  # trust policy would accept a token from any repository on GitHub, since the
  # issuer is shared by all of them.
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:JamBalaya56562/blog:ref:refs/heads/main"
        }
      }
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "lambda-deploy"
  role = aws_iam_role.github_actions.name

  policy = jsonencode({
    Statement = [{
      Action   = "ecr:GetAuthorizationToken"
      Effect   = "Allow"
      Resource = "*"
      }, {
      Action   = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:ListImages", "ecr:BatchDeleteImage"]
      Effect   = "Allow"
      Resource = aws_ecr_repository.blog.arn
      }, {
      Action   = ["lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:UpdateFunctionCode", "lambda:UpdateFunctionConfiguration"]
      Effect   = "Allow"
      Resource = aws_lambda_function.blog.arn
    }]
    Version = "2012-10-17"
  })
}

# ── The OpenTofu identities ──────────────────────────────────────────────
#
# Created by hand before this configuration could run — the roles that let CI
# manage the account cannot themselves be created by CI. They are imported
# here so they stop being the one thing nobody is watching.
#
# Two of them rather than one, and the split is in the trust policy rather
# than in the permissions: a pull request from any branch can read the account
# and say what it would do, and only a commit that reached main can change
# anything.

resource "aws_iam_role" "tofu_plan" {
  name        = "github-actions-blog-tofu-plan"
  description = "OpenTofu plan from pull requests. Read-only."

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        # Wide on purpose: `sub` differs between a branch push and a
        # pull_request event, and this role cannot write anything.
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:JamBalaya56562/blog:*"
        }
      }
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "tofu_plan_read_only" {
  role       = aws_iam_role.tofu_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role" "tofu_apply" {
  name        = "github-actions-blog-tofu-apply"
  description = "OpenTofu apply from main."

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:JamBalaya56562/blog:ref:refs/heads/main"
        }
      }
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
    }]
    Version = "2012-10-17"
  })
}

# PowerUserAccess is everything except IAM, which covers every service in these
# files. IAM is added back below, narrowed to the resources they describe.
resource "aws_iam_role_policy_attachment" "tofu_apply_power_user" {
  role       = aws_iam_role.tofu_apply.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

resource "aws_iam_role_policy" "tofu_apply_iam" {
  name = "tofu-iam"
  role = aws_iam_role.tofu_apply.name

  policy = jsonencode({
    Statement = [{
      Sid    = "ManageOwnRolesAndPolicies"
      Effect = "Allow"
      Action = [
        "iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:UpdateRole",
        "iam:UpdateAssumeRolePolicy", "iam:TagRole", "iam:UntagRole",
        "iam:ListRoleTags", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole", "iam:GetRolePolicy", "iam:PutRolePolicy",
        "iam:DeleteRolePolicy", "iam:AttachRolePolicy", "iam:DetachRolePolicy",
        "iam:PassRole",
      ]
      Resource = [
        "arn:aws:iam::647089171678:role/service-role/blog-role-*",
        "arn:aws:iam::647089171678:role/github-actions-blog-*",
      ]
      }, {
      Sid    = "ManageOwnManagedPolicies"
      Effect = "Allow"
      Action = [
        "iam:GetPolicy", "iam:GetPolicyVersion", "iam:CreatePolicy",
        "iam:DeletePolicy", "iam:CreatePolicyVersion", "iam:DeletePolicyVersion",
        "iam:ListPolicyVersions", "iam:ListPolicyTags", "iam:ListEntitiesForPolicy",
        "iam:TagPolicy", "iam:UntagPolicy",
      ]
      Resource = "arn:aws:iam::647089171678:policy/service-role/AWSLambdaBasicExecutionRole-*"
      }, {
      Sid    = "ManageTheGitHubProvider"
      Effect = "Allow"
      Action = [
        "iam:GetOpenIDConnectProvider", "iam:CreateOpenIDConnectProvider",
        "iam:DeleteOpenIDConnectProvider", "iam:UpdateOpenIDConnectProviderThumbprint",
        "iam:AddClientIDToOpenIDConnectProvider",
        "iam:RemoveClientIDFromOpenIDConnectProvider",
        "iam:TagOpenIDConnectProvider", "iam:UntagOpenIDConnectProvider",
        "iam:ListOpenIDConnectProviderTags",
      ]
      Resource = aws_iam_openid_connect_provider.github.arn
      }, {
      Sid      = "ListingIsNotResourceScoped"
      Effect   = "Allow"
      Action   = ["iam:ListRoles", "iam:ListPolicies", "iam:ListOpenIDConnectProviders"]
      Resource = "*"
    }]
    Version = "2012-10-17"
  })
}
