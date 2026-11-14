provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = "blog"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project = "blog"
    }
  }
}
