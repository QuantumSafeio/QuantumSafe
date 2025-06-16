/*
  # Create payments table for Web3 transactions

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `network` (text, blockchain network)
      - `transaction_hash` (text, blockchain transaction hash)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `amount` (numeric, payment amount)
      - `currency` (text, payment currency)
      - `status` (text, payment status)
      - `service_type` (text, type of service purchased)
      - `verified_at` (timestamptz, verification timestamp)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for authenticated users to manage their own payments

  3. Indexes
    - Add indexes for performance optimization
    - Unique index on transaction_hash (where not null)

  4. Triggers
    - Auto-update updated_at timestamp