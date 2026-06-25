import React from 'react';

const SubscriptionDetails = ({ jsonData, plan, method }) => {

    const {
        id,
        start_time,
        billing_info,
    } = jsonData;

    localStorage.setItem('subscriberId', id);
    localStorage.setItem('billing', billing_info.next_billing_time);

    return (
        <div>
            <p><strong>Payment Method:</strong> {method.toUpperCase()}</p>
            <p><strong>Plan:</strong> {plan}</p>
            <p><strong>Subscription ID:</strong> {id}</p>
            <p><strong>Start Time:</strong> {start_time}</p>
            <p><strong>Next Billing Time:</strong> {billing_info.next_billing_time}</p>
            <p><strong>Amount:</strong> {billing_info.last_payment.amount.value} {billing_info.last_payment.amount.currency_code}</p>
        </div>
    );
};

export default SubscriptionDetails;
