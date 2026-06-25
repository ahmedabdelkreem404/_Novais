import React from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';

const Failed = () => {

    const navigate = useNavigate();
    function redirectPricing() {
      navigate("/pricing");
    }

    return (
        <div>
            <Header isHome={true}  />
            <div>
                <div>
                    <p>Payment Failed</p>
                    <p>Your payment failed<br></br>You can start the payment process again</p>
                    <Button  onClick={redirectPricing}>Start Again</Button>
                </div>
            </div>
            <Footers  />
        </div>
    );
};

export default Failed;
