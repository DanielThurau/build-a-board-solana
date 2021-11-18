// Solana Imports
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

// React Imports
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Local Imports
import twitterLogo  from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';


// Solana Constants
const { SystemProgram } = web3;
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {
    preflightCommitment: "processed"
};

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);



// Constants
const TWITTER_HANDLE = 'DanielNThurau';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

/*
'https://build-a-board-bucket.s3.us-west-1.amazonaws.com/iesmCerok_M.jpg',
'https://build-a-board-bucket.s3.us-west-1.amazonaws.com/oDYHPruGqrw.jpg',
'https://build-a-board-bucket.s3.us-west-1.amazonaws.com/ofUXJt4EssI.jpg',
'https://build-a-board-bucket.s3.us-west-1.amazonaws.com/oJrTZGV8DZY.jpg'
*/
const KING_PIC = "https://build-a-board-bucket.s3.us-west-1.amazonaws.com/rmLI9kg_ppE.jpg";

const App = () => {

    // State 
    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [picList, setPicList] = useState([]);


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const checkIfWalletConnected = async () => {
        try {
            // This is where the solana component is injected
            const { solana } = window;

            if (solana) {
                if (solana.isPhantom) {
                    const response = await solana.connect({ onlyIfTrusted: true });
                    console.log("Public Key: ", response.publicKey.toString());
                    setWalletAddress(response.publicKey.toString());
                    await getPicList();
                } else {
                    console.log("Not sure what kind of wallet you have :/")
                    console.log(solana)
                }
            } else {
                alert('Solana object not found! Get a Phantom Wallet 👻 (https://phantom.app/)');
            }

        } catch (error) {
            console.error(error);
        }
    }


    const connectWallet = async () => {
        try {
            const { solana } = window;

            if (solana) {
                const response = await solana.connect();
                console.log("Connected with Public Key: ", response.publicKey.toString());
                setWalletAddress(response.publicKey.toString());
                await getPicList();
            }
        } catch (error) {
            console.log("Failed to connect wallet")
            console.log(error);
        }
    };

    const onInputChange = (event) => {
        const { value } = event.target;
        setInputValue(value);
    };

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new Provider(connection, window.solana, opts.preflightCommitment);

        return provider;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getPicList = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

            console.log("Got the account", account);

            let sortedList = account.picList;
            sortedList = sortedList.sort((a, b) => (Number(a.voteCount) < Number(b.voteCount)) ? 1 : -1);
            setPicList(sortedList);
        } catch (error) {
            console.log("Error in getPicList: ", error);
            setPicList(null);
        }
    };

    const createPicAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            console.log("Ping");
            await program.rpc.startStuffOff({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount]
            });
            console.log("Created a new BaseAccount w/ Address:", baseAccount.publicKey.toString());
            await getPicList();
        } catch(error) {
            console.log("Error creating BaseAccount account:", error);
        }
    };

    const submitPic = async () => {
        if (inputValue.length === 0) {
            console.log("No link given!");
            return;
        }

        console.log('Link:', inputValue);

        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            await program.rpc.addPic(inputValue, {
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                },
            });
            console.log("Pic successfully sent to program", inputValue);

            await getPicList();
        } catch (error) {
            console.log("Error ending Pic Link: ", error);
        }
    };

    const upvotePic = async (pic_link) => {
        console.log(pic_link);
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            
            await program.rpc.upvotePic(pic_link, {
                accounts: {
                    baseAccount: baseAccount.publicKey,
                },
            });

            console.log("Pic successfully upvoted", pic_link);

            await getPicList();

        } catch (error) {
            console.log("Error upvoting Pic", error);
        }
    }


    const renderNotConnectedContainer = () => (
        <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
        >
            Connect Phantom Wallet
        </button>
    );

    const renderConnectedContainer = () => {
        if (picList === null) {
            return (
                <div className="connected-container">
                    <button className="cta-button submit-gif-button" onClick={createPicAccount}>
                        Do One-Time Initialization For PIC Program Account
                    </button>
                </div>
            );
        } else {

            return (


                <div className="connected-container">
                    <div className="king-pic-container">
                        <div className="king-pic-item">
                            <p className="header1">Ongoing Board</p>

                            <img src={KING_PIC} alt={KING_PIC} />
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Enter image link" 
                        value={inputValue}
                        onChange={onInputChange}
                    />
                    <button 
                        className="cta-button submit-gif-button"
                        onClick={submitPic}
                    >
                        Submit
                    </button>

                    <div className="gif-grid">
                        {picList.map((pic, index) => (
                            <div className="gif-item" key={index}>
                                <img src={pic.picLink} alt={pic.picLink} />
                                
                                <p className="header3">
                                    Submitter's Address: 

                                    
                                    <CopyToClipboard
                                        text={pic.userAddress.toString()}>
                                        <button className="address-copy-button">
                                            {pic.userAddress.toString()}
                                        </button>
                                    </CopyToClipboard>

                                    
                                </p>
                                <p className="header3">
                                Upvote count: {pic.voteCount.toString()}
                                <button 
                                    className="cta-button submit-gif-button"
                                    onClick={() => upvotePic(pic.picLink)}>
                                    Upvote
                                </button>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };


    useEffect(() => {
        window.addEventListener('load', async (event) => {
            await checkIfWalletConnected();
        });
    }, [checkIfWalletConnected]);

    return (
        
        <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>                
                <div className="header-container">
                    <p className="header">🖼 Build A Board</p>
                    <p className="sub-text">
                        Help build a piece of art that will become an NFT. Submit images and vote on daily additions.
                    </p>
                    {/* Render the connect wallet component */}
                    {!walletAddress && renderNotConnectedContainer()}
                    {walletAddress && renderConnectedContainer()}
                </div>

                <div className="footer-container">
                    <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >{`follow me at @${TWITTER_HANDLE}`}</a>
                </div>
            </div>
        </div>
    );
};

export default App;
