import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Approval,
  ApprovalForAll,
  BatchMetadataUpdate,
  LicenseOfferCreated,
  LicensePurchased,
  MetadataUpdate,
  OwnershipTransferred,
  Transfer
} from "../generated/LicenseNFT/LicenseNFT"

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createBatchMetadataUpdateEvent(
  _fromTokenId: BigInt,
  _toTokenId: BigInt
): BatchMetadataUpdate {
  let batchMetadataUpdateEvent = changetype<BatchMetadataUpdate>(newMockEvent())

  batchMetadataUpdateEvent.parameters = new Array()

  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_fromTokenId",
      ethereum.Value.fromUnsignedBigInt(_fromTokenId)
    )
  )
  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_toTokenId",
      ethereum.Value.fromUnsignedBigInt(_toTokenId)
    )
  )

  return batchMetadataUpdateEvent
}

export function createLicenseOfferCreatedEvent(
  ipTokenId: BigInt,
  offerIndex: BigInt,
  ipOwner: Address,
  priceWei: BigInt,
  licenseURI: string,
  expiry: BigInt
): LicenseOfferCreated {
  let licenseOfferCreatedEvent = changetype<LicenseOfferCreated>(newMockEvent())

  licenseOfferCreatedEvent.parameters = new Array()

  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "ipTokenId",
      ethereum.Value.fromUnsignedBigInt(ipTokenId)
    )
  )
  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "offerIndex",
      ethereum.Value.fromUnsignedBigInt(offerIndex)
    )
  )
  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam("ipOwner", ethereum.Value.fromAddress(ipOwner))
  )
  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "priceWei",
      ethereum.Value.fromUnsignedBigInt(priceWei)
    )
  )
  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam("licenseURI", ethereum.Value.fromString(licenseURI))
  )
  licenseOfferCreatedEvent.parameters.push(
    new ethereum.EventParam("expiry", ethereum.Value.fromUnsignedBigInt(expiry))
  )

  return licenseOfferCreatedEvent
}

export function createLicensePurchasedEvent(
  ipTokenId: BigInt,
  licenseTokenId: BigInt,
  buyer: Address,
  offerIndex: BigInt,
  priceWei: BigInt
): LicensePurchased {
  let licensePurchasedEvent = changetype<LicensePurchased>(newMockEvent())

  licensePurchasedEvent.parameters = new Array()

  licensePurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "ipTokenId",
      ethereum.Value.fromUnsignedBigInt(ipTokenId)
    )
  )
  licensePurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "licenseTokenId",
      ethereum.Value.fromUnsignedBigInt(licenseTokenId)
    )
  )
  licensePurchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  licensePurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "offerIndex",
      ethereum.Value.fromUnsignedBigInt(offerIndex)
    )
  )
  licensePurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "priceWei",
      ethereum.Value.fromUnsignedBigInt(priceWei)
    )
  )

  return licensePurchasedEvent
}

export function createMetadataUpdateEvent(_tokenId: BigInt): MetadataUpdate {
  let metadataUpdateEvent = changetype<MetadataUpdate>(newMockEvent())

  metadataUpdateEvent.parameters = new Array()

  metadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_tokenId",
      ethereum.Value.fromUnsignedBigInt(_tokenId)
    )
  )

  return metadataUpdateEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}
