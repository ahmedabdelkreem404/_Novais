<?php

namespace App\Http\Controllers;

use App\Models\PersonalNote;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NoteController extends Controller
{
    public function index()
    {
        $notes = Auth::user()->personalNotes()->with(['course:id,title', 'lesson:id,title'])->latest()->get();
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'lesson_id' => 'nullable|exists:lessons,id',
            'content' => 'required|string'
        ]);

        $user = Auth::user();
        $course = Course::where('id', $request->course_id)->where('user_id', $user->id)->first();
        if (!$course) {
            return response()->json(['error' => 'common.unauthorized'], 403);
        }

        if ($request->lesson_id) {
            $lessonBelongsToCourse = Lesson::where('id', $request->lesson_id)
                ->where('course_id', $course->id)
                ->exists();

            if (!$lessonBelongsToCourse) {
                return response()->json(['error' => 'common.unauthorized'], 403);
            }
        }

        $note = $user->personalNotes()->create($request->only(['course_id', 'lesson_id', 'content']));
        return response()->json($note, 201);
    }

    public function update(Request $request, $id)
    {
        $note = Auth::user()->personalNotes()->findOrFail($id);
        $note->update($request->only('content'));
        return response()->json($note);
    }

    public function destroy($id)
    {
        $note = Auth::user()->personalNotes()->findOrFail($id);
        $note->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
