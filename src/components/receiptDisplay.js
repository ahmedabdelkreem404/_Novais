import React from 'react';

const ReceiptDisplay = ({ jsonData }) => {

    const {
        id,
        start_time,
        billing_info,
    } = jsonData;

    return (
        <div>
            <h2>Receipt Information</h2>
            <p><strong>Subscription ID:</strong> {id}</p>
            <p><strong>Start Time:</strong> {start_time}</p>
            <p><strong>Next Billing Time:</strong> {billing_info.next_billing_time}</p>
            <p><strong>Amount:</strong> {billing_info.last_payment.amount.value} {billing_info.last_payment.amount.currency_code}</p>
        </div>
    );
};

export default ReceiptDisplay;
