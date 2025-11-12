<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; padding: 0; }
        .date { text-align: right; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
    </div>
    
    <div class="date">
        <p>Generated on: {{ $date }}</p>
    </div>
    
    <div class="content">
        <!-- Add your report content here -->
        <h2>Library Statistics</h2>
        <!-- Example table -->
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Users</td>
                    <td>{{ $stats['total_users'] ?? 0 }}</td>
                </tr>
                <tr>
                    <td>Total Publications</td>
                    <td>{{ $stats['total_publications'] ?? 0 }}</td>
                </tr>
                <!-- Add more metrics as needed -->
            </tbody>
        </table>
    </div>
</body>
</html>
