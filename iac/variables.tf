variable "project_name" {
	type = string
}

variable "aws_region" {
	type    = string
	default = "us-east-1"
}

variable "ecs_cluster_id" {
	type = string
}

variable "ecs_role_arn" {
	type = string
}

variable "vpc_id" {
	type = string
}

variable "alb_arn" {
	type = string
}

variable "container_image_url" {
	type = string
}

variable "container_image_tag" {
	type    = string
	default = "latest"
}

variable "container_port" {
	type    = number
	default = 80
}

variable "db_host" {
	type = string
}

variable "db_port" {
	type    = number
	default = 5432
}

variable "db_name" {
	type = string
}

variable "db_username" {
	type = string
}

variable "db_password" {
	type      = string
	sensitive = true
}

variable "app_subnet_ids" {
	type = list(string)
}

variable "app_security_group_ids" {
	type = list(string)
}


variable "gateway_security_group_ids" {
	type = list(string)
}

variable "desired_count" {
	type    = number
	default = 1
}

variable "api_cpu" {
	type    = string
	default = "512"
}

variable "api_memory" {
	type    = string
	default = "1024"
}


variable "generate_openapi_docs" {
	type    = bool
	default = true
}