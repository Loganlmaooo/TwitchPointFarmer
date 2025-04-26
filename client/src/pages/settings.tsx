import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings, useSendWebhookTest, useSendDailySummary, useStartFarming, useStopFarming } from "@/hooks/use-twitch";
import { Save, RefreshCw, Send, AlertTriangle, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form schema for Twitch API settings
const twitchFormSchema = z.object({
  twitchUsername: z.string().min(1, "Username is required"),
  twitchClientId: z.string().min(1, "Client ID is required"),
  twitchAccessToken: z.string().min(1, "Access token is required"),
  twitchRefreshToken: z.string().min(1, "RefreshCw token is required"),
});

// Form schema for Discord webhook settings
const discordFormSchema = z.object({
  discordWebhookUrl: z.string().url("Must be a valid URL").min(1, "Webhook URL is required"),
});

// Form schema for general settings
const generalFormSchema = z.object({
  maxConcurrentChannels: z.coerce.number().int().min(1, "Must be at least 1"),
  refreshInterval: z.coerce.number().int().min(10, "Must be at least 10 seconds"),
});

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateSettings();
  const { mutate: sendTestWebhook, isPending: isSendingTest } = useSendWebhookTest();
  const { mutate: sendDailySummary, isPending: isSendingSummary } = useSendDailySummary();
  const { mutate: startFarming, isPending: isStarting } = useStartFarming();
  const { mutate: stopFarming, isPending: isStopping } = useStopFarming();
  
  // Form for general settings
  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      maxConcurrentChannels: settings?.maxConcurrentChannels ?? 5,
      refreshInterval: settings?.refreshInterval ?? 60,
    },
    values: {
      maxConcurrentChannels: settings?.maxConcurrentChannels ?? 5,
      refreshInterval: settings?.refreshInterval ?? 60,
    },
  });
  
  // Form for Twitch API settings
  const twitchForm = useForm<z.infer<typeof twitchFormSchema>>({
    resolver: zodResolver(twitchFormSchema),
    defaultValues: {
      twitchUsername: settings?.twitchUsername ?? "",
      twitchClientId: settings?.twitchClientId ?? "",
      twitchAccessToken: settings?.twitchAccessToken ?? "",
      twitchRefreshToken: settings?.twitchRefreshToken ?? "",
    },
    values: {
      twitchUsername: settings?.twitchUsername ?? "",
      twitchClientId: settings?.twitchClientId ?? "",
      twitchAccessToken: settings?.twitchAccessToken ?? "",
      twitchRefreshToken: settings?.twitchRefreshToken ?? "",
    },
  });
  
  // Form for Discord webhook settings
  const discordForm = useForm<z.infer<typeof discordFormSchema>>({
    resolver: zodResolver(discordFormSchema),
    defaultValues: {
      discordWebhookUrl: settings?.discordWebhookUrl ?? "",
    },
    values: {
      discordWebhookUrl: settings?.discordWebhookUrl ?? "",
    },
  });

  // Form submit handlers
  const onSubmitGeneral = (data: z.infer<typeof generalFormSchema>) => {
    updateSettings(data);
  };
  
  const onSubmitTwitch = (data: z.infer<typeof twitchFormSchema>) => {
    updateSettings(data);
  };
  
  const onSubmitDiscord = (data: z.infer<typeof discordFormSchema>) => {
    updateSettings(data);
  };

  const handleSendTestWebhook = () => {
    sendTestWebhook();
  };

  const handleSendDailySummary = () => {
    sendDailySummary();
  };

  const handleStartFarming = () => {
    startFarming();
  };

  const handleStopFarming = () => {
    stopFarming();
  };

  return (
    <div>
      {/* Settings Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-twitch-lightgray mb-4">
          <TabsTrigger value="general" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
            General
          </TabsTrigger>
          <TabsTrigger value="twitch" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
            Twitch API
          </TabsTrigger>
          <TabsTrigger value="discord" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
            Discord Webhook
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure general behavior of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                </div>
              ) : (
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="maxConcurrentChannels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Concurrent Channels</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Maximum number of channels to farm points from simultaneously
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="refreshInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RefreshCw Interval (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            How often to check for new points and channel status
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6 bg-twitch-lightgray" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Farming Controls</h3>
                      <div className="flex flex-col md:flex-row md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                        <Button
                          type="button"
                          variant="default"
                          onClick={handleStartFarming}
                          disabled={isStarting}
                          className="bg-green-700 hover:bg-green-600 text-white"
                        >
                          <Play className="h-4 w-4 mr-2" /> Start Farming
                        </Button>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleStopFarming}
                          disabled={isStopping}
                        >
                          <Square className="h-4 w-4 mr-2" /> Stop Farming
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isUpdating || !generalForm.formState.isDirty}
                      className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Settings
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Twitch API Settings */}
        <TabsContent value="twitch" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Twitch API Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure your Twitch API credentials for automatic farming
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                </div>
              ) : (
                <Form {...twitchForm}>
                  <form onSubmit={twitchForm.handleSubmit(onSubmitTwitch)} className="space-y-6">
                    <div className="bg-twitch-darker border border-twitch-lightgray rounded-md p-4 mb-6">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-twitch-warning mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Important Note</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            To use this application, you need to create a Twitch Developer Application and get the required credentials.
                            Visit the <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener noreferrer" className="text-twitch-purple hover:underline">Twitch Developer Console</a> to get started.
                          </p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={twitchForm.control}
                      name="twitchUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitch Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Your Twitch username
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={twitchForm.control}
                      name="twitchClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            The Client ID from your Twitch Developer Application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={twitchForm.control}
                      name="twitchAccessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Token</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            OAuth access token with required scopes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={twitchForm.control}
                      name="twitchRefreshToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RefreshCw Token</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            OAuth refresh token for automatically renewing the access token
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isUpdating || !twitchForm.formState.isDirty}
                      className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Credentials
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discord Webhook Settings */}
        <TabsContent value="discord" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Discord Webhook Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure Discord integration for notifications and logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                  <Skeleton className="h-10 w-full bg-twitch-lightgray" />
                </div>
              ) : (
                <Form {...discordForm}>
                  <form onSubmit={discordForm.handleSubmit(onSubmitDiscord)} className="space-y-6">
                    <FormField
                      control={discordForm.control}
                      name="discordWebhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discord Webhook URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                              placeholder="https://discord.com/api/webhooks/..."
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            The webhook URL from your Discord channel settings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendTestWebhook}
                        disabled={isSendingTest || !settings?.discordWebhookUrl}
                        className="bg-twitch-darker border-twitch-lightgray hover:bg-twitch-lightgray"
                      >
                        <Send className="h-4 w-4 mr-2" /> Send Test Message
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendDailySummary}
                        disabled={isSendingSummary || !settings?.discordWebhookUrl}
                        className="bg-twitch-darker border-twitch-lightgray hover:bg-twitch-lightgray"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Send Daily Summary
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdating || !discordForm.formState.isDirty}
                      className="bg-twitch-purple hover:bg-twitch-lightpurple text-white mt-4"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Webhook
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
