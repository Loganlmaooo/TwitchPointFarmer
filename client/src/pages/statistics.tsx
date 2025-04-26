import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats, useTwitchChannels } from "@/hooks/use-twitch";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useStats();
  const { data: channels, isLoading: isChannelsLoading, refetch: refetchChannels } = useTwitchChannels();

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchChannels(),
    ]);
  };

  // Format watch time for display
  const formatWatchTime = (minutes?: number): string => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Mock data generator for charts
  const generateChartData = () => {
    // This would normally come from your API with real data
    const now = new Date();
    const dayData = [];
    const totalPoints = stats?.totalPointsCollected || 0;
    const avgPointsPerHour = stats?.pointsPerHour || 100;
    
    // Create data points for the past week (7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Simulate some variance in the data
      const pointsVariance = Math.floor((Math.random() * 0.3 + 0.85) * avgPointsPerHour * 24);
      const watchTimeVariance = Math.floor(Math.random() * 60 + 60 * 23);
      
      dayData.push({
        day: formattedDate,
        points: pointsVariance,
        watchTime: watchTimeVariance,
      });
    }
    
    return dayData;
  };

  // Generate data for channel comparison pie chart
  const generateChannelData = () => {
    if (!channels) return [];
    
    return channels.map(channel => ({
      name: channel.channelName,
      points: channel.pointsCollected,
      watchTime: channel.watchTimeMinutes,
    }));
  };

  const chartData = generateChartData();
  const channelData = generateChannelData();

  // Chart colors based on the Twitch theme
  const COLORS = ['#9146FF', '#00FC8E', '#FFCA28', '#FF4B4B', '#0070F3'];

  return (
    <div>
      {/* Statistics Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Statistics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="bg-twitch-lightgray hover:bg-twitch-gray border-0 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-twitch-gray border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-2">Total Points Collected</h3>
              {isStatsLoading ? (
                <Skeleton className="h-10 w-32 bg-twitch-lightgray" />
              ) : (
                <p className="text-3xl font-bold">{stats?.totalPointsCollected?.toLocaleString() || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-twitch-gray border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-2">Total Watch Time</h3>
              {isStatsLoading ? (
                <Skeleton className="h-10 w-32 bg-twitch-lightgray" />
              ) : (
                <p className="text-3xl font-bold">{formatWatchTime(stats?.totalWatchTimeMinutes)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-twitch-gray border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-2">Average Points/Hour</h3>
              {isStatsLoading ? (
                <Skeleton className="h-10 w-32 bg-twitch-lightgray" />
              ) : (
                <p className="text-3xl font-bold">{stats?.pointsPerHour?.toLocaleString() || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="points" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-twitch-lightgray">
            <TabsTrigger value="points" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
              Points
            </TabsTrigger>
            <TabsTrigger value="watchTime" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
              Watch Time
            </TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
              Channels
            </TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button 
              variant={timeRange === "day" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("day")}
              className={timeRange === "day" ? "bg-twitch-purple" : "bg-twitch-lightgray border-0"}
            >
              Day
            </Button>
            <Button 
              variant={timeRange === "week" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("week")}
              className={timeRange === "week" ? "bg-twitch-purple" : "bg-twitch-lightgray border-0"}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("month")}
              className={timeRange === "month" ? "bg-twitch-purple" : "bg-twitch-lightgray border-0"}
            >
              Month
            </Button>
          </div>
        </div>

        <TabsContent value="points" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Points Collected Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-[400px] w-full bg-twitch-lightgray" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#38383D" />
                    <XAxis dataKey="day" stroke="#EFEFF1" />
                    <YAxis stroke="#EFEFF1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#38383D' }}
                      labelStyle={{ color: '#EFEFF1' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      name="Points" 
                      stroke="#9146FF" 
                      strokeWidth={2} 
                      dot={{ fill: '#9146FF', r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchTime" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Watch Time Per Day</CardTitle>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-[400px] w-full bg-twitch-lightgray" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#38383D" />
                    <XAxis dataKey="day" stroke="#EFEFF1" />
                    <YAxis stroke="#EFEFF1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#38383D' }}
                      labelStyle={{ color: '#EFEFF1' }}
                      formatter={(value: any) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Watch Time']}
                    />
                    <Legend />
                    <Bar dataKey="watchTime" name="Watch Time (minutes)" fill="#00FC8E" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Points by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              {isChannelsLoading ? (
                <Skeleton className="h-[400px] w-full bg-twitch-lightgray" />
              ) : channelData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-gray-400">
                  <p>No channel data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-center mb-4 text-gray-400">Points Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={channelData}
                          dataKey="points"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#38383D' }}
                          formatter={(value: any) => [value.toLocaleString(), 'Points']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-center mb-4 text-gray-400">Watch Time Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={channelData}
                          dataKey="watchTime"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#38383D' }}
                          formatter={(value: any) => [formatWatchTime(value), 'Watch Time']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
