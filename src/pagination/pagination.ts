import {
    ButtonInteraction,
    MessageActionRow,
    MessageButton,
    MessageButtonStyleResolvable,
    MessageComponentType,
    MessageEmbed,
} from "discord.js";
import { ButtonNames, PaginationOptions } from "./pagination.interfaces";

const defaultEmojis = {
    first: "⏪",
    previous: "◀",
    next: "▶",
    last: "⏩",
    close: "❎",
};

const defaultStyles = {
    first: "PRIMARY",
    previous: "PRIMARY",
    next: "PRIMARY",
    last: "PRIMARY",
    close: "DANGER",
};

export const pagination = async (options: PaginationOptions) => {
    const {
        message,
        embeds,
        button,
        time,
        max,
        customFilter,
        fastSkip,
        pageTravel,
    } = options;
    let currentPage = 1;

    const getButtonData = (name: ButtonNames) => {
        return button?.find((btn) => btn.name === name);
    };

    const generateButtons = (state?: boolean) => {
        const checkState = (name: ButtonNames) => {
            if (
                (["first", "previous"] as ButtonNames[]).includes(name) &&
                currentPage === 1
            )
                return true;

            if (
                (["next", "last"] as ButtonNames[]).includes(name) &&
                currentPage === embeds.length
            )
                return true;

            return false;
        };

        let names: ButtonNames[] = ["previous", "next"];
        if (fastSkip) names = ["first", ...names, "last"];
        if (pageTravel) names.push("close");

        return names.reduce(
            (accumulator: MessageButton[], name: ButtonNames) => {
                accumulator.push(
                    new MessageButton()
                        .setEmoji(
                            getButtonData(name)?.emoji || defaultEmojis[name]
                        )
                        .setCustomId(name)
                        .setDisabled(state || checkState(name))
                        .setStyle(
                            getButtonData(name)?.style ||
                                (defaultStyles[
                                    name
                                ] as MessageButtonStyleResolvable)
                        )
                );
                return accumulator;
            },
            []
        );
    };

    const components = (state?: boolean) => [
        new MessageActionRow().addComponents(generateButtons(state)),
    ];

    const changeFooter = () => {
        const embed = embeds[currentPage - 1];
        const newEmbed = new MessageEmbed(embed);
        if (embed?.footer?.text) {
            return newEmbed.setFooter(
                `${embed.footer.text} - Pagina ${currentPage} de ${embeds.length}`,
                embed.footer.iconURL
            );
        }
        return newEmbed.setFooter(`Pagina ${currentPage} de ${embeds.length}`);
    };

    const initialMessage = await message.channel.send({
        embeds: [changeFooter()],
        components: components(),
    });

    const defaultFilter = (interaction: ButtonInteraction) => {
        if (!interaction.deferred) interaction.deferUpdate();
        return interaction.user.id === message.author.id;
    };

    const filter = customFilter || defaultFilter;

    const collectorOptions = () => {
        const opt = {
            filter,
            componentType: "BUTTON" as MessageComponentType,
        };

        if (max) opt["max"] = max;
        if (time) opt["time"] = time;

        return opt;
    };

    const collector = message.channel.createMessageComponentCollector(
        collectorOptions()
    );

    const pageTravelling = new Set();

    const closeTravel = async () => {
            return message.delete()
        
    };

    collector.on("collect", async (interaction) => {
        const id = interaction.customId as ButtonNames;

        if (id === "first") currentPage = 1;
        if (id === "previous") currentPage--;
        if (id === "next") currentPage++;
        if (id === "last") currentPage = embeds.length;
        if (id === "close") await closeTravel();

        initialMessage.edit({
            embeds: [changeFooter()],
            components: components(),
        });
    });

    collector.on("end", () => {
        initialMessage.edit({
            components: components(true),
        });
    });
};
