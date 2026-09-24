# infra

OpenTofu configuration for the AWS account this blog runs in.

Nothing here was created by OpenTofu. The account was built by hand over a
couple of years, and this directory adopted it: the resources were brought into
state through `import` blocks, which have since been deleted. The target state
is a plan that reports **no changes**. That is the contract. A plan proposing to
add, change or destroy anything means the configuration has drifted from the
account, not that the account needs correcting.

## What is managed

| File | Resources |
| --- | --- |
| [lambda.tf](lambda.tf) | The function, its URL, its log group and the four statements on its resource policy |
| [storage.tf](storage.tf) | The DynamoDB table for page views, the ECR repository and its lifecycle policy |
| [iam.tf](iam.tf) | The function's execution role, the GitHub Actions deploy role and the OIDC provider behind it |
| [cdn.tf](cdn.tf) | The CloudFront distribution and its origin access control |
| [dns.tf](dns.tf) | The hosted zone, its records and the ACM certificate |

Two things are deliberately absent.

**NS and SOA records.** Route 53 writes both when it creates a zone, and
`aws_route53_zone` already reports them. Importing them as records would give a
future plan something to argue with and buy nothing.

**The image tag on the Lambda function.** Deploys come from
[lambda.yml](../.github/workflows/lambda.yml), which pushes a new tag on every
merge. `image_uri` is under `ignore_changes` so the two do not fight; the value
in the file is only what it was when this was written.

## Running it

Two things are needed, and the second one is easy to forget with expensive
consequences.

The AWS provider needs credentials. With a browser session from `aws login` or
an SSO profile, hand them to OpenTofu as environment variables rather than
configuring the provider.

**And the state has to be fetched first.** It lives in a GitHub Actions
artifact, so a fresh clone has none, and `tofu plan` against an empty state
reports every resource as something to create rather than saying no changes. The
plan is not wrong — it is answering a different question — but it reads like the
account is empty, and running `apply` on it would try to build a second copy of
everything.

```bash
eval "$(aws configure export-credentials --format env)"

GITHUB_REPOSITORY=JamBalaya56562/blog ../.github/scripts/fetch-tofu-state.sh .

tofu init
tofu plan
```

Run it from `infra/`. The script is the one the workflows use, so it takes the
same state they would — see [State](#state) for which one that is.

Delete `terraform.tfstate` when you are done. A copy left behind goes stale the
moment CI applies anything, and a stale state plans against an account that no
longer looks like that. Fetch it again next time; it is one command.

`tofu fmt` is part of `mise lint`.

## Starting a second site from this

Values here are read from the resources that produce them rather than pasted:
the alias records take the distribution's own `domain_name` and
`hosted_zone_id`, the certificate's validation record comes from
`domain_validation_options`, the origin host is the function URL with its
scheme trimmed off, and the two CloudFront policies are looked up by name. So
the order things have to be created in — certificate, validation record,
distribution, alias records — is something OpenTofu works out from the
references. Copying this for another domain is mostly a matter of changing
`domain_name`.

Three things still differ when the account is empty rather than already built.

**Add `aws_acm_certificate_validation`.** It is a wait, not a resource: it
blocks until ACM sees the DNS record and issues the certificate. Nothing in AWS
corresponds to it, which is why it is absent here — it would show up as
something to add, against a contract of adding nothing. From scratch you need
it, or CloudFront will be handed a certificate that is still `PENDING_VALIDATION`
and refuse it.

**Choose your own names.** `blog-role-5p8437k8`, the `/service-role/` path and
the copied `AWSLambdaBasicExecutionRole-f205ec3b-…` policy are what the console
generated in 2024. They are kept because renaming a role means destroying and
recreating it. A new account has no reason to inherit them.

**The image has to exist before the function does.** `aws_lambda_function` with
`package_type = "Image"` cannot be created against a tag that has not been
pushed. Apply the ECR repository first, push an image to it, then apply the
rest.

The domain registration itself is not here and cannot be: registering is a
purchase. `aws_route53domains_registered_domain` can manage an existing
registration's auto-renew, transfer lock and contacts, but the hosted zone —
which is what this file has — is a separate resource from the registration.

## State

State lives in a GitHub Actions artifact named `tofu-state`, not in this
repository and not in S3. Every workflow restores it through
[fetch-tofu-state.sh](../.github/scripts/fetch-tofu-state.sh), which asks the
API for the newest unexpired artifact of that name rather than tracking a run id
somewhere.

The name alone is not enough to trust it. Any run in the repository can upload
an artifact called `tofu-state`, including a pull request's, which runs the
workflow files from the pull request, and the apply role can change IAM. So the
script takes only an artifact made by [tofu-apply.yml](../.github/workflows/tofu-apply.yml)
or [tofu-state-backup.yml](../.github/workflows/tofu-state-backup.yml), on
`main`, in this repository rather than a fork, from a push, schedule or dispatch
run, and skips anything else with a warning. It extracts `terraform.tfstate`
and nothing else, and checks that it parses as a state before writing it.

A missing state is an error in all three workflows. The apply in particular
refuses to run: against an empty state it would try to build a second copy of
the account. The one time that is the intent — rebuilding after a deliberate
`tofu destroy` — run the apply workflow by hand with `bootstrap` ticked.

Artifacts expire, and this configuration can go months without a change.
[tofu-state-backup.yml](../.github/workflows/tofu-state-backup.yml) downloads
the state every Monday and uploads it again, which restarts the retention
clock. That workflow is not optional housekeeping: without it the state
disappears 90 days after the last apply, and with it every way to apply at all.
If it ever finds nothing to refresh it fails, so the loss shows up as a red run
on a Monday rather than as a refused apply later.

## Why there are no `import` blocks

There were, for exactly one apply. They are gone now, and that is deliberate
rather than tidying.

Keeping them looks like insurance against a lost state and is not. An `import`
block whose target does not exist is a hard error, so leaving them in makes
`tofu destroy` a one-way door: the next apply stops at the first block instead
of rebuilding what was destroyed. Being able to tear the stack down and put it
back is worth more than a second line of defence against losing the state, which
the weekly backup already covers.

If the state is ever lost for real, the way back is to write the blocks again —
one per resource, `to` the address in these files and `id` the identifier AWS
already knows — and delete them after the apply, exactly as before.

## Workflows

| Workflow | Trigger | Role |
| --- | --- | --- |
| [tofu-plan.yml](../.github/workflows/tofu-plan.yml) | pull request touching `infra/**` | `github-actions-blog-tofu-plan`, read-only |
| [tofu-apply.yml](../.github/workflows/tofu-apply.yml) | push to `main` touching `infra/**` | `github-actions-blog-tofu-apply`, `main` only |
| [tofu-state-backup.yml](../.github/workflows/tofu-state-backup.yml) | Mondays | none — GitHub side only |

Both AWS roles are assumed through the OIDC provider this configuration
manages; neither has an access key. The split is the point: a pull request can
read the account and say what it would do, and only a commit that reached
`main` can change anything.

The plan role carries `ReadOnlyAccess`. The apply role carries
`PowerUserAccess`, which covers every service here but excludes IAM, plus an
inline policy granting IAM only over the roles, the customer-managed policy and
the OIDC provider that appear in these files. That does not make the role
harmless — anything that can write IAM can widen its own reach — but it keeps
an accident inside the blast radius of this stack.

The role ARNs come from the repository variables `AWS_TOFU_PLAN_ROLE_ARN` and
`AWS_TOFU_APPLY_ROLE_ARN`.

The deploy in [lambda.yml](../.github/workflows/lambda.yml) ends by clearing
the CloudFront cache, which it finds through the repository variable
`CLOUDFRONT_DISTRIBUTION_ID`. Its value is the `cloudfront_distribution_id`
output, printed at the end of every apply.
