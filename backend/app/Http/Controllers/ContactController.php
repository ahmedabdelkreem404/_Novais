<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    // Public: Store contact message
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fname' => 'required|string',
            'lname' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string', // Frontend sends number but better store as string/numeric string
            'msg' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $contact = Contact::create($request->all());

        return response()->json(['success' => true, 'message' => 'contact.message_sent']);
    }

    // Admin: Get all contacts
    public function index()
    {
        return response()->json(Contact::latest()->paginate(20));
    }

    // Admin: Reply to contact
    public function reply(Request $request, $id)
    {
        $request->validate(['reply' => 'required|string']);
        
        $contact = Contact::findOrFail($id);
        
        // Send Email
        try {
            \Illuminate\Support\Facades\Mail::to($contact->email)->send(new \App\Mail\ContactReplyMail($contact, $request->reply));
            // Mark as replied logic if we had a status column. For MVP, just send email.
        } catch (\Exception $e) {
            return response()->json(['error' => 'common.failed_to_send_email'], 500);
        }

        return response()->json(['message' => 'contact.reply_sent']);
    }
    // Admin: Delete contact
    public function destroy($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->delete();

        return response()->json(['message' => 'contact.contact_deleted']);
    }

    // Admin: Update status (Mark as Read)
    public function updateStatus(Request $request, $id)
    {
        $contact = Contact::findOrFail($id);
        $contact->update(['status' => 'read']);

        return response()->json(['message' => 'contact.contact_read']);
    }
}
