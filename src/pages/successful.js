import React, { useEffect, useState } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { serverURL } from '../constants';
import axios from 'axios';
import { Spinner } from 'flowbite-react';
import SubscriptionDetails from '../components/subscriptionDetails';

const Successful = () => {

    const [jsonData, setJsonData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [method, setMethod] = useState('');

    useEffect(() => {
        getDetails();
    });

    async function getDetails() {
        const dataToSend = {
            uid: localStorage.getItem('uid')
        };
        try {
            const postURL = serverURL + '/api/subscriptiondetail';
            await axios.post(postURL, dataToSend).then(res => {
                setJsonData(res.data.session);
                setMethod(res.data.method);
                setIsLoading(false);
                sendUpdate();
            });
        } catch (error) {
            //DO NOTHING
        }
    }

    async function sendUpdate() {
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(currentUrl);
        let subscriptionId = '';
        urlParams.forEach((value, key) => {
            if (key.includes('subscription_id')) {
                subscriptionId = value;
            }
        });
        const dataToSend = {
            id: subscriptionId,
            mName: localStorage.getItem('mName'),
            email: localStorage.getItem('email'),
            user: localStorage.getItem('uid'),
            plan: localStorage.getItem('type')
        };
        try {
            const postURL = serverURL + '/api/paypalupdateuser';
            await axios.post(postURL, dataToSend);
        } catch (error) {
            //ERROR
        }

    }

    return (
        <div>
            <Header isHome={true}  />
            <div>
                <div>
                    <p>Thank You🎉</p>
                    <p><strong>{localStorage.getItem('mName')}</strong> you have Modifed your plan to {localStorage.getItem('type')}.<br></br> You will be charged ${localStorage.getItem('price')} From {localStorage.getItem('billing')}.</p>
                    {isLoading && <>
                        <div>
                            <Spinner size="xl"  />
                        </div>
                    </>}
                    {!isLoading && <SubscriptionDetails jsonData={jsonData} plan={localStorage.getItem('type')} method={method} />}
                </div>
            </div>
            <Footers  />
        </div>
    );
};

export default Successful;
