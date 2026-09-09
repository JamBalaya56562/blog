resource "aws_dynamodb_table" "page_views" {
  name         = "blog-page-views"
  billing_mode = "PROVISIONED"
  hash_key     = "pk"
  range_key    = "slug"
  table_class  = "STANDARD"

  # Provisioned rather than on-demand because the free tier covers 25 units of
  # each indefinitely, where on-demand bills per request from the first one.
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "slug"
    type = "S"
  }
}

resource "aws_ecr_repository" "blog" {
  name                 = "blog"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Two images: the one Lambda is running and the one before it. Nothing here
# rolls back to an older image, and the repository had grown to fifteen before
# this policy existed.
resource "aws_ecr_lifecycle_policy" "blog" {
  repository = aws_ecr_repository.blog.name

  policy = jsonencode({
    rules = [{
      action = {
        type = "expire"
      }
      description  = "Keep the running image and the one before it"
      rulePriority = 1
      selection = {
        countNumber = 2
        countType   = "imageCountMoreThan"
        tagStatus   = "any"
      }
    }]
  })
}
