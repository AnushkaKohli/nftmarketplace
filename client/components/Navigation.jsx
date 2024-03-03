import React from 'react';
import  Link from 'next/link';

const Naviagtion = () => {
  return (
    <nav className='border-b p-6'>
        <p className='text-4xl font-bold'>NFT Marketplace</p>
        <div className='flex mt-4'></div>
        <Link className='mr-6 text-pink-500' href='/'>
            Home
        </Link>
        <Link className='mr-6 text-pink-500' href='/create-nft'>
            Sell NFT
        </Link>
        <Link className='mr-6 text-pink-500' href='/my-nfts'>
            My NFT
        </Link>
        <Link className='mr-6 text-pink-500' href='/creator-dashboard'>
            Dashboard
        </Link>
    </nav>
  )
}

export default Naviagtion
