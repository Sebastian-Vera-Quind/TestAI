project_name = "your-project-name"
aws_region   = "us-east-1"

ecs_cluster_id = "arn:aws:ecs:<region>:<account-id>:cluster/<cluster-name>"
ecs_role_arn   = "arn:aws:iam::<account-id>:role/<execution-role-name>"

vpc_id = "vpc-<id>"

app_subnet_ids = [
  "subnet-<id-az-a>",
]

app_security_group_ids = [
  "sg-<backend-sg-id>",
]

gateway_security_group_ids = [
  "sg-<vpclink-sg-id>",
]

alb_arn = "arn:aws:elasticloadbalancing:<region>:<account-id>:loadbalancer/app/<alb-name>/<id>"

container_image_url = "<account-id>.dkr.ecr.<region>.amazonaws.com/<repository>"
container_image_tag = "latest"
container_port      = 80

db_host     = "<cluster-name>.cluster-<id>.<region>.rds.amazonaws.com"
db_port     = 5432
db_name     = "<database-name>"
db_username = "<username>"
db_password = "<password>"

desired_count = 1
api_cpu       = "512"
api_memory    = "1024"

generate_openapi_docs = true