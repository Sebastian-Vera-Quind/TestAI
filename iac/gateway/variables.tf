variable "project_name" {
  type        = string
  description = "Project name"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for the VPC Link"
}

variable "security_group_ids" {
  type        = list(string)
  description = "Security group IDs for the VPC Link"
}

variable "alb_listener_arn" {
  type        = string
  description = "ALB listener ARN to route traffic to via VPC Link"
}
