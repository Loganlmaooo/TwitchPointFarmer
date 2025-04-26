import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateChannel } from "@/hooks/use-twitch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertTwitchChannelSchema } from "@shared/schema";

interface AddChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = insertTwitchChannelSchema.extend({
  channelName: z.string().min(1, "Channel name is required"),
});

export default function AddChannelModal({ open, onOpenChange }: AddChannelModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelName: "",
      autoClaimPoints: true,
      claimBonuses: true,
      sendLogsToDiscord: true,
      autoFollow: false,
      priority: "medium",
    },
  });

  const { mutate: createChannel, isPending } = useCreateChannel();

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createChannel(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-twitch-gray border-twitch-lightgray text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Channel</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the channel name to start farming points.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="channelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., xQc"
                      {...field}
                      className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Enter the Twitch channel username
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Farming Options</FormLabel>
              
              <FormField
                control={form.control}
                name="autoClaimPoints"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-twitch-purple data-[state=checked]:border-twitch-purple"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Auto-claim channel points</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="claimBonuses"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-twitch-purple data-[state=checked]:border-twitch-purple"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Claim bonus points</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sendLogsToDiscord"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-twitch-purple data-[state=checked]:border-twitch-purple"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Send logs to Discord</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="autoFollow"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-twitch-purple data-[state=checked]:border-twitch-purple"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Auto-follow channel if not followed</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-twitch-darker border-twitch-lightgray focus:ring-twitch-purple">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-twitch-darker border-twitch-lightgray">
                      <SelectItem value="high">High - Always farm this channel</SelectItem>
                      <SelectItem value="medium">Medium - Farm when online</SelectItem>
                      <SelectItem value="low">Low - Farm only when no higher priority channels are available</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent border-twitch-lightgray hover:bg-twitch-lightgray"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-twitch-purple hover:bg-twitch-lightpurple"
              >
                Add Channel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
