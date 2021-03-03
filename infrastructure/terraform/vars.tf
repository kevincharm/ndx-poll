variable "do_api_token" {}

variable "actual_aws_access_key_id" {}

variable "actual_aws_secret_access_key" {}

variable "cloudflare_api_token" {}

variable "do_ssh_keys" {
  type = list(string)
  default = [
    "fb:a7:f1:a0:29:01:cb:87:b4:4e:85:79:45:cd:26:15", # kevs-mbp-16-2020
  ]
}

variable "ndx_poll_fqdn" {
  # default = "poll.indexed.finance"
  default = "ndx.spicyme.me"
}

variable "ndx_poll_cloudflare_zone_id" {
  default = "1bfd141d59c1659f076f0a81177fb1b4"
}
