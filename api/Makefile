.PHONY: ecr-login build deploy run

DOCKERFILE=api/Dockerfile
REPO=$$(cd ../infrastructure/terraform && AWS_PROFILE=digitalocean terraform output ndx_poll_ecr_endpoint)
IMAGE=ndx-poll-api
TAG=latest

default: build ecr-login push deploy

build:
	# Set build context to monorepo root then build image
	cd .. && docker build . -f $(DOCKERFILE) -t $(IMAGE):$(TAG)

push:
	# Might first require login: doctl registry login
	docker tag $(IMAGE):$(TAG) $(REPO)/$(IMAGE):$(TAG)
	docker push $(REPO)/$(IMAGE):$(TAG)

run:
	docker run -it --rm -v `pwd`:/work $(IMAGE):$(TAG)
