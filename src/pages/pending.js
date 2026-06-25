import React, { useState } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { serverURL, websiteURL } from '../constants';
import axios from 'axios';
import { AiOutlineLoading } from 'react-icons/ai';
import { Button } from 'flowbite-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const Pending = () => {

    const { state } = useLocation();
    const { sub, link } = state || {};
    const [processing, setProcessing] = useState(false);

    const showToast = async (msg) => {
        setProcessing(false);
        toast(msg, {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
        });
    }

    async function refresh() {
        const dataToSend = {
            sub: sub
        };
        try {
            setProcessing(true);
            const postURL = serverURL + '/api/razorapypending';
            await axios.post(postURL, dataToSend).then(res => {
                if (res.data.status === 'active') {
                    setProcessing(true);
                    const approveHref = websiteURL + '/success?subscription_id=' + sub;
                    window.location.href = approveHref;
                } else if (res.data.status === 'expired' || res.data.status === 'cancelled') {
                    const approveHref = websiteURL + '/failed';
                    window.location.href = approveHref;
                }
                else {
                    showToast("Payment is still pending");
                }
            });
        } catch (error) {
            //DO NOTHING
        }
    }

    function redirect() {
        window.open(link, '_blank');
    }

    return (
        <div>
            <Header isHome={true}  />
            <div>
                <div>
                    <p>Payment Pending</p>
                    <p><strong>{localStorage.getItem('mName')}</strong> please make the payment.</p>
                    <Button onClick={redirect}>Payment Link</Button>
                    <Button onClick={refresh} isProcessing={processing} processingSpinner={<AiOutlineLoading  />}>Verify Payment</Button>
                </div>
            </div>
            <Footers  />
        </div>
    );
};

export default Pending;
