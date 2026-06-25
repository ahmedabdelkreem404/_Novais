import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './ui/Card'; // Alias Card as GlassCard to minimize diff, or just rename
import Card from './ui/Card';
import Button from './ui/Button';
import { FiCheck } from 'react-icons/fi';

const PricingPlan = (props) => {
    const navigate = useNavigate();

    function redirectPayment() {
        if (localStorage.getItem('auth') === null || localStorage.getItem('type') === 'free') {
            navigate('/payment', { state: { plan: props.data.type } });
        } else {
            navigate('/subscription');
        }
    }

    const isPro = props.data.type !== 'Free Plan';

    return (
        <Card
            tilt
            className="p-8 flex flex-col h-full relative z-10 transition-transform duration-300">
            <div className="mb-6">
                {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                        Recommended
                    </span>
                )}
                <h5 className="text-xl font-bold text-gray-900 mb-2">{props.data.type}</h5>
                <div className="flex items-baseline mb-1">
                    <span className="text-3xl font-bold text-gray-900 mx-1">{props.data.cost}</span>
                    <span className="text-xl font-semibold text-gray-500">ج.م</span>
                    <span className="text-sm font-medium text-gray-500 ml-1">{props.data.time}</span>
                </div>
            </div>

            <div className="h-px bg-gray-200 w-full mb-6" />

            <ul className="space-y-4 mb-8 flex-1">
                {[props.data.one, props.data.two, props.data.three, props.data.four, props.data.five].map((item, idx) => {
                    if (!item) return null;
                    return (
                        <li key={idx} className="flex items-start">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 mr-3 shrink-0 mt-0.5">
                                <FiCheck size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-600 text-sm">{item}</span>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-auto">
                <Button
                    onClick={redirectPayment}
                    variant={isPro ? 'primary' : 'secondary'}
                    className="w-full">
                    {localStorage.getItem('auth') === null || localStorage.getItem('type') === 'free' ? "Get Started" : "Manage Subscription"}
                </Button>
            </div>
        </Card>
    );
};

export default PricingPlan;
