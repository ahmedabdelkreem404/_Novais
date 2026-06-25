import React, { useEffect, useState } from 'react';
import Header from '../components/header';
import Footers from '../components/footers';
import { AiOutlineLoading } from 'react-icons/ai';
import { Button } from 'flowbite-react';
import { MonthCost, MonthType, YearCost, company, logo, serverURL } from '../constants';
import axios from 'axios';
import ReceiptDisplay from '../components/receiptDisplay';
import { Spinner } from 'flowbite-react';
import { toast } from 'react-toastify';
import ReceiptDisplayRazorpay from '../components/receiptDisplayRazorpay';

const Success = () => {

    const [processing, setProcessing] = useState(false);
    const [jsonData, setJsonData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getDetails();
    });

    async function getDetails() {
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(currentUrl);
        let subscriptionId = '';
        urlParams.forEach((value, key) => {
            if (key.includes('subscription_id')) {
                subscriptionId = value;
            }
        });
        const dataToSend = {
            subscriberId: subscriptionId,
            uid: localStorage.getItem('uid'),
            plan: localStorage.getItem('plan')
        };
        try {
            if (localStorage.getItem('method') === 'paypal') {
                const postURL = serverURL + '/api/paypaldetails';
                await axios.post(postURL, dataToSend).then(res => {
                    setJsonData(res);
                    localStorage.setItem('type', localStorage.getItem('plan'));
                    setIsLoading(false);
                    sendEmail(res);
                });
            } else if (localStorage.getItem('method') === 'razorpay') {
                const postURL = serverURL + '/api/razorapydetails';
                await axios.post(postURL, dataToSend).then(res => {
                    setJsonData(res.data);
                    localStorage.setItem('type', localStorage.getItem('plan'));
                    setIsLoading(false);
                    sendEmail(res.data);
                });
            }
        } catch (error) {
            getDetails()
        }
    }

    async function download() {
        if (localStorage.getItem('method') === 'paypal') {
            const {
                id,
                start_time,
                subscriber,
                billing_info,
            } = jsonData['data'];

            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
            
                    <style>
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
            
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
            
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
            
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
            
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
            
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
            
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
            
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
            
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
            
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }
            
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
            
                            .invoice-box table tr.information table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
                        }
            
                        /** RTL **/
                        .invoice-box.rtl {
                            direction: rtl;
                            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        }
            
                        .invoice-box.rtl table {
                            text-align: right;
                        }
            
                        .invoice-box.rtl table tr td:nth-child(2) {
                            text-align: left;
                        }
                    </style>
                </head>
            
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img
                                                    src=${logo}
                                                    style="width: 100%; max-width: 50px"
                                                />
                                            </td>
            
                                            <td>
                                                Subscription Id: ${id}<br />
                                                Strat Time: ${start_time}<br />
                                                Next Billing Time: ${billing_info.next_billing_time}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                            <strong>${company}</strong>
                                                <br />
                                            </td>
            
                                            <td>
                                                ${subscriber.name.given_name} ${subscriber.name.surname}<br />
                                                ${subscriber.shipping_address.address.address_line_1}, ${subscriber.shipping_address.address.postal_code}, ${subscriber.shipping_address.address.country_code}<br />
                                            ${subscriber.email_address}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="heading">
                                <td>Payment Method</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="details">
                                <td>${localStorage.getItem('method')}</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="heading">
                                <td>Item</td>
            
                                <td>Price</td>
                            </tr>
            
                            <tr class="item">
                                <td>${localStorage.getItem('plan')}</td>
            
                                <td>${billing_info.last_payment.amount.value} ${billing_info.last_payment.amount.currency_code}</td>
                            </tr>
            
                            <tr class="total">
                                <td></td>
            
                                <td>Total: ${billing_info.last_payment.amount.value} ${billing_info.last_payment.amount.currency_code}</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;
            setProcessing(true);
            const email = localStorage.getItem('email');
            const postURL = serverURL + '/api/downloadreceipt';
            const response = await axios.post(postURL, { html, email });
            if (response.data.success) {
                showToast(response.data.message);
            } else {
                download();
            }
        } else if (localStorage.getItem('method') === 'razorpay') {
            const {
                id,
                current_start,
                charge_at,
            } = jsonData;

            const date = new Date(current_start * 1000);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const startDate = `${year}-${month}-${day}`;

            const date2 = new Date(charge_at * 1000);
            const year2 = date2.getFullYear();
            const month2 = date2.getMonth() + 1;
            const day2 = date2.getDate();
            const endDate = `${year2}-${month2}-${day2}`;
            let amount = '';
            if (localStorage.getItem('plan') === MonthType) {
                amount = MonthCost
            } else {
                amount = YearCost
            }

            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
            
                    <style>
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
            
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
            
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
            
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
            
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
            
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
            
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
            
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
            
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
            
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }
            
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
            
                            .invoice-box table tr.information table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
                        }
            
                        /** RTL **/
                        .invoice-box.rtl {
                            direction: rtl;
                            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        }
            
                        .invoice-box.rtl table {
                            text-align: right;
                        }
            
                        .invoice-box.rtl table tr td:nth-child(2) {
                            text-align: left;
                        }
                    </style>
                </head>
            
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img
                                                    src=${logo}
                                                    style="width: 100%; max-width: 50px"
                                                />
                                            </td>
            
                                            <td>
                                                Subscription Id: ${id}<br />
                                                Strat Time: ${startDate}<br />
                                                Next Billing Time: ${endDate}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                            <strong>${company}</strong>
                                                <br />
                                            </td>
                                            <td>
                                                ${jsonData['notes'].notes_key_1}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="heading">
                                <td>Payment Method</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="details">
                                <td>${localStorage.getItem('method')}</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="heading">
                                <td>Item</td>
            
                                <td>Price</td>
                            </tr>
            
                            <tr class="item">
                                <td>${localStorage.getItem('plan')}</td>
            
                                <td>${amount} USD</td>
                            </tr>
            
                            <tr class="total">
                                <td></td>
            
                                <td>Total: ${amount} USD</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;
            setProcessing(true);
            const email = localStorage.getItem('email');
            const postURL = serverURL + '/api/downloadreceipt';
            const response = await axios.post(postURL, { html, email });
            if (response.data.success) {
                showToast(response.data.message);
            } else {
                download();
            }
        }

    }

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

    async function sendEmail(jsonData) {
        if (localStorage.getItem('method') === 'paypal') {
            const {
                id,
                start_time,
                subscriber,
                billing_info,
            } = jsonData['data'];

            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
            
                    <style>
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
            
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
            
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
            
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
            
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
            
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
            
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
            
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
            
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
            
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }
            
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
            
                            .invoice-box table tr.information table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
                        }
            
                        /** RTL **/
                        .invoice-box.rtl {
                            direction: rtl;
                            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        }
            
                        .invoice-box.rtl table {
                            text-align: right;
                        }
            
                        .invoice-box.rtl table tr td:nth-child(2) {
                            text-align: left;
                        }
                    </style>
                </head>
            
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img
                                                    src=${logo}
                                                    style="width: 100%; max-width: 50px"
                                                />
                                            </td>
            
                                            <td>
                                                Subscription Id: ${id}<br />
                                                Strat Time: ${start_time}<br />
                                                Next Billing Time: ${billing_info.next_billing_time}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                            <strong>${company}</strong>
                                                <br />
                                            </td>
            
                                            <td>
                                                ${subscriber.name.given_name} ${subscriber.name.surname}<br />
                                                ${subscriber.shipping_address.address.address_line_1}, ${subscriber.shipping_address.address.postal_code}, ${subscriber.shipping_address.address.country_code}<br />
                                            ${subscriber.email_address}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="heading">
                                <td>Payment Method</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="details">
                                <td>${localStorage.getItem('method')}</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="heading">
                                <td>Item</td>
            
                                <td>Price</td>
                            </tr>
            
                            <tr class="item">
                                <td>${localStorage.getItem('plan')}</td>
            
                                <td>${billing_info.last_payment.amount.value} ${billing_info.last_payment.amount.currency_code}</td>
                            </tr>
            
                            <tr class="total">
                                <td></td>
            
                                <td>Total: ${billing_info.last_payment.amount.value} ${billing_info.last_payment.amount.currency_code}</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;
            try {
                const email = localStorage.getItem('email');
                const plan = localStorage.getItem('plan');
                const user = localStorage.getItem('uid');
                const subscription = id;
                const subscriberId = subscriber.email_address;
                const method = localStorage.getItem('method');
                const postURL = serverURL + '/api/sendreceipt';
                await axios.post(postURL, { html, email, plan, subscriberId, user, method, subscription });
            } catch (error) {
                //ERROR
            }
        } else if (localStorage.getItem('method') === 'razorpay') {
            const {
                id,
                current_start,
                charge_at,
                customer_id
            } = jsonData;

            const date = new Date(current_start * 1000);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const startDate = `${year}-${month}-${day}`;

            const date2 = new Date(charge_at * 1000);
            const year2 = date2.getFullYear();
            const month2 = date2.getMonth() + 1;
            const day2 = date2.getDate();
            const endDate = `${year2}-${month2}-${day2}`;
            let amount = '';
            if (localStorage.getItem('plan') === MonthType) {
                amount = MonthCost
            } else {
                amount = YearCost
            }

            const html = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>A simple, clean, and responsive HTML invoice template</title>
            
                    <style>
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
            
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
            
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
            
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
            
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
            
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
            
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
            
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
            
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
            
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }
            
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
            
                            .invoice-box table tr.information table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
                        }
            
                        /** RTL **/
                        .invoice-box.rtl {
                            direction: rtl;
                            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        }
            
                        .invoice-box.rtl table {
                            text-align: right;
                        }
            
                        .invoice-box.rtl table tr td:nth-child(2) {
                            text-align: left;
                        }
                    </style>
                </head>
            
                <body>
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img
                                                    src=${logo}
                                                    style="width: 100%; max-width: 50px"
                                                />
                                            </td>
            
                                            <td>
                                                Subscription Id: ${id}<br />
                                                Strat Time: ${startDate}<br />
                                                Next Billing Time: ${endDate}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="information">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td>
                                            <strong>${company}</strong>
                                                <br />
                                            </td>
            
                                            <td>
                                            ${jsonData['notes'].notes_key_1}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
            
                            <tr class="heading">
                                <td>Payment Method</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="details">
                                <td>${localStorage.getItem('method')}</td>
            
                                <td></td>
                            </tr>
            
                            <tr class="heading">
                                <td>Item</td>
            
                                <td>Price</td>
                            </tr>
            
                            <tr class="item">
                                <td>${localStorage.getItem('plan')}</td>
            
                                <td>${amount} USD</td>
                            </tr>
            
                            <tr class="total">
                                <td></td>
            
                                <td>Total: ${amount} USD</td>
                            </tr>
                        </table>
                    </div>
                </body>
            </html>`;
            try {
                const email = localStorage.getItem('email');
                const plan = localStorage.getItem('plan');
                const user = localStorage.getItem('uid');
                const subscription = id;
                const subscriberId = customer_id;;
                const method = localStorage.getItem('method');
                const postURL = serverURL + '/api/sendreceipt';
                await axios.post(postURL, { html, email, plan, subscriberId, user, method, subscription });
            } catch (error) {
                //ERROR
            }
        }

    }

    return (
        <div>
            <Header isHome={true}  />
            <div>
                <div>
                    <p>Thank You🎉</p>
                    <p><strong>{localStorage.getItem('mName')}</strong> for subscribing to our <strong>{localStorage.getItem('plan')}</strong> Plan. <br></br> Download your Receipt</p>
                    <Button onClick={download} isProcessing={processing} processingSpinner={<AiOutlineLoading  />}  type="submit">Download</Button>
                    {isLoading && <>
                        <div>
                            <Spinner size="xl"  />
                        </div>
                    </>}
                    {localStorage.getItem('method') === 'paypal' ? <>{!isLoading && <ReceiptDisplay jsonData={jsonData['data']} />}</> : <>{!isLoading && <ReceiptDisplayRazorpay jsonData={jsonData} />}</>}

                </div>
            </div>
            <Footers  />
        </div>
    );
};

export default Success;
