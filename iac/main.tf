module "app" {
  source = "./app"

  project_name = var.project_name
  aws_region   = var.aws_region

  ecs_cluster_id = var.ecs_cluster_id
  ecs_role_arn   = var.ecs_role_arn
  vpc_id         = var.vpc_id
  alb_arn        = var.alb_arn

  container_image_url   = var.container_image_url
  container_image_tag   = var.container_image_tag
  container_port        = var.container_port
  db_host               = var.db_host
  db_port               = var.db_port
  db_username           = var.db_username
  db_password           = var.db_password
  db_name               = var.db_name
  subnet_ids            = var.app_subnet_ids
  security_group_ids    = var.app_security_group_ids
  desired_count         = var.desired_count
  api_cpu               = var.api_cpu
  api_memory            = var.api_memory
  generate_openapi_docs = var.generate_openapi_docs
}

module "gateway" {
  source = "./gateway"

  project_name = var.project_name
  aws_region   = var.aws_region

  subnet_ids         = var.app_subnet_ids
  security_group_ids = var.gateway_security_group_ids
  alb_listener_arn   = module.app.listener_arn
}
