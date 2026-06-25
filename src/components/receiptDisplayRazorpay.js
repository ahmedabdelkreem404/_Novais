import React from 'react';
import { MonthCost, MonthType, YearCost } from '../constants';

const ReceiptDisplayRazorpay = ({ jsonData }) => {

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
    if (localStorage.getItem('type') === MonthType) {
        amount = MonthCost
    } else {
        amount = YearCost
    }

    return (
        <div>
            <h2>Receipt Information</h2>
            <p><strong>Subscription ID:</strong> {id}</p>
            <p><strong>Start Time:</strong> {startDate}</p>
            <p><strong>Next Billing Time:</strong> {endDate}</p>
            <p><strong>Amount:</strong> {amount} USD</p>
        </div>
    );
};

export default ReceiptDisplayRazorpay;
