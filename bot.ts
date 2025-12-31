import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from "discord.js";
import { storage } from "./storage";

class BotManager {
  private client: Client | null = null;
  private startTime: number | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  async start(token: string) {
    if (this.client) {
      throw new Error("Bot is already running");
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.client.on("ready", async () => {
      console.log(`Logged in as ${this.client?.user?.tag}!`);
      this.startTime = Date.now();
      await this.registerCommands(token);
      this.startStatsUpdater();
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === "setup_ticket") {
          await this.handleSetupTicket(interaction);
        } else if (commandName === "ticket_stats") {
          await this.handleTicketStats(interaction);
        }
      } else if (interaction.isButton()) {
        if (interaction.customId.startsWith("open_ticket_")) {
          await this.handleOpenTicket(interaction);
        }
      }
    });

    try {
      await this.client.login(token);
      await storage.saveBotConfig({ token, isActive: true });
      return true;
    } catch (error) {
      this.client = null;
      throw error;
    }
  }

  private async registerCommands(token: string) {
    if (!this.client?.user) return;

    const commands = [
      new SlashCommandBuilder()
        .setName("setup_ticket")
        .setDescription("إعداد نظام التكت"),
      new SlashCommandBuilder()
        .setName("ticket_stats")
        .setDescription("عرض إحصائيات التكتات"),
    ].map((command) => command.toJSON());

    const rest = new REST({ version: "10" }).setToken(token);

    try {
      await rest.put(Routes.applicationCommands(this.client.user.id), {
        body: commands,
      });
    } catch (error) {
      console.error("Failed to register commands:", error);
    }
  }

  private async handleSetupTicket(interaction: any) {
    const settings = await storage.getTicketSettings();
    if (!settings) return interaction.reply("لم يتم العثور على إعدادات.");

    const embed = new EmbedBuilder()
      .setTitle(settings.messageTitle || "فتح تكت")
      .setDescription(settings.messageDescription || "اضغط على الزر أدناه لفتح تكت جديد")
      .setColor(0x0099ff);

    if (settings.imageUrl) embed.setImage(settings.imageUrl);

    const row = new ActionRowBuilder<ButtonBuilder>();
    
    if (settings.buttons && Array.isArray(settings.buttons) && settings.buttons.length > 0) {
      settings.buttons.forEach((btn: any, index: number) => {
        const button = new ButtonBuilder()
          .setCustomId(`open_ticket_${index}`)
          .setLabel(btn.label)
          .setStyle(btn.style || ButtonStyle.Primary);
        if (btn.emoji) button.setEmoji(btn.emoji);
        row.addComponents(button);
      });
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("open_ticket_default")
          .setLabel("فتح تكت")
          .setStyle(ButtonStyle.Primary)
      );
    }

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  private async handleOpenTicket(interaction: any) {
    const guild = interaction.guild;
    const user = interaction.user;

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ["ViewChannel"],
        },
        {
          id: user.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
      ],
    });

    await storage.createTicket({
      channelId: channel.id,
      userId: user.id,
      status: "open",
    });

    await interaction.reply({ content: `تم فتح التكت: ${channel}`, ephemeral: true });

    // Log if channel exists
    const settings = await storage.getTicketSettings();
    if (settings?.logChannelId) {
      const logChannel = guild.channels.cache.get(settings.logChannelId);
      if (logChannel?.isTextBased()) {
        await logChannel.send(`تم فتح تكت جديد بواسطة ${user.tag} في ${channel}`);
      }
    }
  }

  private async handleTicketStats(interaction: any) {
    const openTicketsCount = await storage.getOpenTicketsCount();
    await interaction.reply({ content: `عدد التكتات المفتوحة حالياً: **${openTicketsCount}**` });
  }

  private startStatsUpdater() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    
    this.statsInterval = setInterval(async () => {
      // Logic for auto-updating a specific message if needed
    }, 5000);
  }

  async stop() {
    if (this.client) {
      if (this.statsInterval) clearInterval(this.statsInterval);
      await this.client.destroy();
      this.client = null;
      this.startTime = null;
      const config = await storage.getBotConfig();
      if (config) await storage.updateBotConfig(config.id, false);
    }
  }

  getStatus() {
    return {
      isRunning: !!this.client?.isReady(),
      botName: this.client?.user?.tag,
      uptime: this.startTime ? Date.now() - this.startTime : undefined,
    };
  }
}

export const botManager = new BotManager();
