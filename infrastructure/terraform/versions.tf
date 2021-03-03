terraform {
  required_providers {
    aws = {
      version = "~> 3.3.0"
      source  = "hashicorp/aws"
    }
    cloudflare = {
      version = "~> 2.10.0"
      source  = "terraform-providers/cloudflare"
    }
    digitalocean = {
      version = "~> 1.22.2"
      source  = "terraform-providers/digitalocean"
    }
  }
  required_version = ">= 0.13"
}
