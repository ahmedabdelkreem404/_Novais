<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
    <style>
        body { font-family: sans-serif; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; line-height: inherit; text-align: left; }
        td { padding: 5px; vertical-align: top; }
        tr.top table td { padding-bottom: 20px; }
        tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        tr.item td { border-bottom: 1px solid #eee; }
        tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <table>
            <tr class="top">
                <td colspan="2">
                    <table>
                        <tr>
                            <td class="title">NOVAIS Invoice</td>
                            <td>
                                Invoice #: {{ $payment->transaction_id }}<br>
                                Created: {{ $payment->created_at->format('F d, Y') }}<br>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="heading">
                <td>Item</td>
                <td>Price</td>
            </tr>
            <tr class="item">
                <td>Subscription Plan</td>
                <td>{{ $payment->amount }} {{ $payment->currency }}</td>
            </tr>
            <tr class="total">
                <td></td>
                <td>Total: {{ $payment->amount }} {{ $payment->currency }}</td>
            </tr>
        </table>
    </div>
</body>
</html>
