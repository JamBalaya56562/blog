variable "aws_region" {
  description = "Region holding the Lambda function, its image and its table"
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "Domain the site is served from"
  type        = string
  default     = "kokohore56562wanwan.site"
}
