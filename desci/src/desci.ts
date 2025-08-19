import {
  GovernanceTokenMinted as GovernanceTokenMintedEvent,
  DisputeCreated as DisputeCreatedEvent,
  VoteCast as VoteCastEvent,
  DisputeResolved as DisputeResolvedEvent,
} from "../generated/Desci/Desci"

import {
  GovernanceTokenMinted,
  DisputeCreated,
  VoteCast,
  DisputeResolved,
} from "../generated/schema"

export function handleGovernanceTokenMinted(
  event: GovernanceTokenMintedEvent,
): void {
  let entity = new GovernanceTokenMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.cost = event.params.cost

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeCreated(event: DisputeCreatedEvent): void {
  let entity = new DisputeCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.disputeId = event.params.disputeId
  entity.ipTokenId = event.params.ipTokenId
  entity.reporter = event.params.reporter
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.disputeId = event.params.disputeId
  entity.voter = event.params.voter
  entity.voteForRemoval = event.params.voteForRemoval
  entity.votingPower = event.params.votingPower

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let entity = new DisputeResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.disputeId = event.params.disputeId
  entity.ipRevoked = event.params.ipRevoked
  entity.totalVotes = event.params.totalVotes

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}


