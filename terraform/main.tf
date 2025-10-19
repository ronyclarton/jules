# --- Provider Configuration ---
provider "aws" {
  region = "us-east-1"
}

# --- VPC for our services ---
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "production-vpc"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "private-subnet-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = { Name = "private-subnet-b" }
}

# --- EKS Cluster (Kubernetes) ---
resource "aws_iam_role" "eks_cluster_role" {
  name = "eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_eks_cluster" "main" {
  name     = "production-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  }

  depends_on = [aws_iam_role.eks_cluster_role]
}

# --- RDS Database (PostgreSQL) ---
variable "db_password" {
  description = "The password for the RDS database"
  type        = string
  sensitive   = true
}

resource "aws_db_instance" "main" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  name                 = "production_db"
  username             = "admin"
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  vpc_security_group_ids = [] # Needs to be configured with security groups
}

# --- S3 Bucket for 3D Assets ---
resource "aws_s3_bucket" "assets" {
  bucket = "ai-3d-platform-assets-production" # Bucket names must be globally unique

  tags = {
    Name        = "3D Model Assets"
    Environment = "Production"
  }
}

# --- ECR Repository for Docker Images ---
resource "aws_ecr_repository" "app" {
  name                 = "ai-3d-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- Outputs ---
output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "db_instance_address" {
  value = aws_db_instance.main.address
}

output "s3_bucket_name" {
  value = aws_s3_bucket.assets.bucket
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}