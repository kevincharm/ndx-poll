DO_API_TOKEN=${DIGITALOCEAN_TOKEN}
TF_FILENAME=ndx_poll
AWS_PROFILE=digitalocean

TF_ARGS=\
	-var="do_api_token=$(DO_API_TOKEN)" \
	-var="cloudflare_api_token=$(INFRAGROK_CLOUDFLARE_API_TOKEN)" \
	-var="actual_aws_access_key_id=$(INFRAGROK_AWS_ACCESS_KEY_ID)" \
	-var="actual_aws_secret_access_key=$(INFRAGROK_AWS_SECRET_ACCESS_KEY)"
TF_PLAN_FILE=$(TF_FILENAME).tfplan
TF_STATE_FILE=$(TF_FILENAME).tfstate


.PHONY: default init plan apply

default: plan apply

init:
	AWS_PROFILE=$(AWS_PROFILE) terraform init

plan:
	AWS_PROFILE=$(AWS_PROFILE) terraform plan -out=$(TF_PLAN_FILE) $(TF_ARGS)

apply:
	AWS_PROFILE=$(AWS_PROFILE) terraform apply $(TF_PLAN_FILE)

destroy:
	AWS_PROFILE=$(AWS_PROFILE) terraform destroy $(TF_ARGS)

output:
	AWS_PROFILE=$(AWS_PROFILE) terraform output
