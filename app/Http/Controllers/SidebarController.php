<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SidebarController extends Controller
{
    public function toggle(Request $request)
    {
        $newState = $request->boolean('sidebarOpen', !$request->session()->get('sidebarOpen', true));
        $request->session()->put('sidebarOpen', $newState);
        
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['success' => true, 'sidebarOpen' => $newState]);
        }
        
        return back()->with('sidebarOpen', $newState);
    }
}
