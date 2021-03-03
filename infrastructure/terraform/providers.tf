provider "digitalocean" {
  token = var.do_api_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
