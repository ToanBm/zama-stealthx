// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

contract MyConfidentialToken is ERC7984, Ownable2Step, SepoliaConfig {
    mapping(address => bool) public hasClaimed;

    constructor(
        string memory name,
        string memory symbol,
        string memory uri,
        uint256 initialSupply, // vẫn truyền để frontend giữ logic tổng cung
        address owner
    )
        ERC7984(name, symbol, uri)
        Ownable(owner)
        SepoliaConfig()
    {}

    // ----------------- OWNER FUNCTIONS -----------------

    function mintConfidential(address to, externalEuint64 encAmount, bytes calldata proof) external onlyOwner {
        euint64 amt = FHE.fromExternal(encAmount, proof);
        _mint(to, amt);
        _afterTokenTransfer(address(0), to, amt);
    }

    function batchMintConfidential(
        address[] calldata recipients,
        externalEuint64[] calldata encAmounts,
        bytes[] calldata proofs
    ) external onlyOwner {
        require(recipients.length == encAmounts.length && recipients.length == proofs.length, "Length mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            euint64 amt = FHE.fromExternal(encAmounts[i], proofs[i]);
            _mint(recipients[i], amt);
            _afterTokenTransfer(address(0), recipients[i], amt);
        }
    }

    function burnConfidential(address from, externalEuint64 encAmount, bytes calldata proof) external onlyOwner {
        euint64 amt = FHE.fromExternal(encAmount, proof);
        _burn(from, amt);
        _afterTokenTransfer(from, address(0), amt);
    }

    function batchTransferConfidential(
        address[] calldata recipients,
        externalEuint64[] calldata encAmounts,
        bytes[] calldata proofs
    ) external onlyOwner {
        require(recipients.length == encAmounts.length && recipients.length == proofs.length, "Length mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            euint64 amt = FHE.fromExternal(encAmounts[i], proofs[i]);
            _transfer(msg.sender, recipients[i], amt);
            _afterTokenTransfer(msg.sender, recipients[i], amt);
        }
    }

    // ----------------- USER FUNCTIONS -----------------

    function faucet(externalEuint64 encAmount, bytes calldata proof) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;

        euint64 amt = FHE.fromExternal(encAmount, proof);
        _mint(msg.sender, amt);
        _afterTokenTransfer(address(0), msg.sender, amt);
    }

    function batchConfidentialTransfer(
        address[] calldata recipients,
        externalEuint64[] calldata encAmounts,
        bytes[] calldata proofs
    ) external {
        require(recipients.length == encAmounts.length && recipients.length == proofs.length, "Length mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            euint64 amt = FHE.fromExternal(encAmounts[i], proofs[i]);
            _transfer(msg.sender, recipients[i], amt);
            _afterTokenTransfer(msg.sender, recipients[i], amt);
        }
    }

    // ----------------- FHE PERMISSIONS -----------------

    function _afterTokenTransfer(
        address from,
        address to,
        euint64 /* amount */
    ) internal {
        if (from != address(0)) {
            euint64 fromBal = confidentialBalanceOf(from);
            FHE.allow(fromBal, from);
            FHE.allow(fromBal, address(this));
        }

        if (to != address(0)) {
            euint64 toBal = confidentialBalanceOf(to);
            FHE.allow(toBal, to);
            FHE.allow(toBal, address(this));
        }
    }
}