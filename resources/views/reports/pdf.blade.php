<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #ffffff;
        }
        
        .container {
            max-width: 100%;
            margin: 0;
            padding: 0;
        }
        
        .header {
            background: #1a202c;
            color: white;
            padding: 40px 30px;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 300;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .header .subtitle {
            font-size: 1rem;
            opacity: 0.8;
            font-weight: 400;
        }
        
        .header .generated-date {
            font-size: 0.85rem;
            opacity: 0.6;
            margin-top: 5px;
        }
        
        .content {
            padding: 0 30px 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px 20px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 4px;
            line-height: 1;
        }
        
        .stat-label {
            color: #718096;
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .chart-section {
            background: #f7fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
        }
        
        .chart-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 16px;
        }
        
        .trend-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .trend-table th {
            background: #edf2f7;
            color: #4a5568;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 0.875rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .trend-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f7fafc;
            font-size: 0.875rem;
        }
        
        .trend-table tr:nth-child(even) {
            background: #f7fafc;
        }
        
        .publications-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            margin-top: 16px;
        }
        
        .publications-table th {
            background: #1a202c;
            color: white;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .publications-table td {
            padding: 16px;
            border-bottom: 1px solid #f7fafc;
            font-size: 0.875rem;
        }
        
        .publications-table tr:nth-child(even) {
            background: #f7fafc;
        }
        
        .user-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 20px;
        }
        
        .user-stat-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
        }
        
        .user-stat-number {
            font-size: 1.875rem;
            font-weight: 700;
            color: #38a169;
            margin-bottom: 4px;
        }
        
        .user-stat-label {
            color: #718096;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            background: #f7fafc;
            border-radius: 6px;
            color: #718096;
            font-size: 0.875rem;
        }
        
        .footer {
            margin-top: 40px;
            padding: 24px 30px;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .footer p {
            color: #718096;
            font-size: 0.875rem;
            margin-bottom: 4px;
        }
        
        .footer .company {
            font-weight: 600;
            color: #1a202c;
        }
        
        @page {
            size: A4;
            margin: 0.75in;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $title }}</h1>
            <div class="subtitle">{{ $date }}</div>
            <div class="generated-date">Generated: {{ $generated_at }}</div>
        </div>

        <div class="content">
            <!-- Overview Statistics -->
            <div class="section">
                <h2 class="section-title">Overview Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">{{ number_format($stats['total_publications']) }}</div>
                        <div class="stat-label">Total Publications</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{{ number_format($stats['publications_this_month']) }}</div>
                        <div class="stat-label">This Month</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{{ number_format($stats['total_users']) }}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{{ $stats['avg_publications_per_month'] }}</div>
                        <div class="stat-label">Avg/Month</div>
                    </div>
                </div>
            </div>

            <!-- Monthly Trends -->
            <div class="section">
                <h2 class="section-title">Monthly Trends</h2>
                <div class="chart-section">
                    <h3 class="chart-title">Publications & Users Growth (Last 6 Months)</h3>
                    <table class="trend-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Publications</th>
                                <th>New Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($monthly_data['months'] as $index => $month)
                            <tr>
                                <td>{{ $month }}</td>
                                <td>{{ $monthly_data['publications'][$index] }}</td>
                                <td>{{ $monthly_data['users'][$index] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recent Publications -->
            <div class="section">
                <h2 class="section-title">Recent Publications</h2>
                @if($recent_publications->count() > 0)
                <table class="publications-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date Added</th>
                            <th>Added By</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($recent_publications as $publication)
                        <tr>
                            <td>{{ Str::limit($publication['title'], 50) }}</td>
                            <td>{{ $publication['date'] }}</td>
                            <td>{{ $publication['user'] }}</td>
                            <td>{{ $publication['type'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                @else
                <div class="no-data">
                    <p>No publications found in the system.</p>
                </div>
                @endif
            </div>

            <!-- User Statistics -->
            <div class="section">
                <h2 class="section-title">User Statistics</h2>
                <div class="user-stats">
                    <div class="user-stat-item">
                        <div class="user-stat-number">{{ $user_stats['total_active'] }}</div>
                        <div class="user-stat-label">Active Users</div>
                    </div>
                    <div class="user-stat-item">
                        <div class="user-stat-number">{{ $user_stats['total_inactive'] }}</div>
                        <div class="user-stat-label">Inactive Users</div>
                    </div>
                    <div class="user-stat-item">
                        <div class="user-stat-number">{{ $stats['users_this_month'] }}</div>
                        <div class="user-stat-label">New This Month</div>
                    </div>
                </div>

                @if($user_stats['by_role']->count() > 0)
                <h3 style="margin-top: 30px; margin-bottom: 15px; color: #1a202c; font-weight: 600;">Users by Role</h3>
                <table class="publications-table">
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($user_stats['by_role'] as $role)
                        <tr>
                            <td>{{ $role->role_name }}</td>
                            <td>{{ $role->count }}</td>
                            <td>{{ round(($role->count / $stats['total_users']) * 100, 1) }}%</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                @endif
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This report was automatically generated by the Library Management System.</p>
            <p>For questions or support, please contact the system administrator.</p>
            <div class="company">Library Management System {{ date('Y') }}</div>
        </div>
    </div>
</body>
</html>
