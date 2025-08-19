import {
  DerivativeCreated as DerivativeCreatedEvent,
  LicenseConsumed as LicenseConsumedEvent,
  ParentAttributed as ParentAttributedEvent,
} from "../generated/DerivativeIP/DerivativeIP"
import {
  DerivativeCreated,
  LicenseConsumed,
  ParentAttributed,
} from "../generated/schema"

function mapDerivativeType(value: i32): string {
  if (value == 0) return "REMIX"
  if (value == 1) return "EXTENSION"
  if (value == 2) return "COLLABORATION"
  if (value == 3) return "VALIDATION"
  if (value == 4) return "CRITIQUE"
  return "UNKNOWN"
}

export function handleDerivativeCreated(event: DerivativeCreatedEvent): void {
  let entity = new DerivativeCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )

  entity.derivativeTokenId = event.params.derivativeTokenId
  entity.parentTokenIds = event.params.parentTokenIds
  entity.creator = event.params.creator
  entity.derivativeType = mapDerivativeType(event.params.derivativeType)
  entity.isCommercial = event.params.isCommercial
  entity.consumedLicenseIds = event.params.consumedLicenseIds

  entity.save()
}

export function handleLicenseConsumed(event: LicenseConsumedEvent): void {
  let entity = new LicenseConsumed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.licenseTokenId = event.params.licenseTokenId
  entity.derivativeTokenId = event.params.derivativeTokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleParentAttributed(event: ParentAttributedEvent): void {
  let entity = new ParentAttributed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.derivativeTokenId = event.params.derivativeTokenId
  entity.parentTokenId = event.params.parentTokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}


