"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagination = void 0;
const discord_js_1 = require("discord.js");
const defaultEmojis = {
    first: "⬅️",
    previous: "◀️",
    number: "❌",
    next: "▶️",
    last: "➡️",
};
const defaultStyles = {
    first: "PRIMARY",
    previous: "PRIMARY",
    number: "DANGER",
    next: "PRIMARY",
    last: "PRIMARY",
};
const pagination = async (options) => {
    const { message, embeds, button, time, max, customFilter, fastSkip, pageTravel, } = options;
    let currentPage = 1;
    const getButtonData = (name) => {
        return button?.find((btn) => btn.name === name);
    };
    const generateButtons = (state) => {
        const checkState = (name) => {
            if (["first", "previous"].includes(name) &&
                currentPage === 1)
                return true;
            if (["next", "last"].includes(name) &&
                currentPage === embeds.length)
                return true;
            return false;
        };
        let names = ["previous", "next"];
        if (fastSkip)
            names = ["first", ...names, "last"];
        if (pageTravel)
            names.push("number");
        return names.reduce((accumulator, name) => {
            accumulator.push(new discord_js_1.MessageButton()
                .setEmoji(getButtonData(name)?.emoji || defaultEmojis[name])
                .setCustomId(name)
                .setDisabled(state || checkState(name))
                .setStyle(getButtonData(name)?.style ||
                defaultStyles[name]));
            return accumulator;
        }, []);
    };
    const components = (state) => [
        new discord_js_1.MessageActionRow().addComponents(generateButtons(state)),
    ];
    const changeFooter = () => {
        const embed = embeds[currentPage - 1];
        const newEmbed = new discord_js_1.MessageEmbed(embed);
        if (embed?.footer?.text) {
            return newEmbed.setFooter(`${embed.footer.text} - Pagina ${currentPage} de ${embeds.length}`, embed.footer.iconURL);
        }
        return newEmbed.setFooter(`Pagina ${currentPage} de ${embeds.length}`);
    };
    const initialMessage = await message.channel.send({
        embeds: [changeFooter()],
        components: components(),
    });
    const defaultFilter = (interaction) => {
        if (!interaction.deferred)
            interaction.deferUpdate();
        return interaction.user.id === message.author.id;
    };
    const filter = customFilter || defaultFilter;
    const collectorOptions = () => {
        const opt = {
            filter,
            componentType: "BUTTON",
        };
        if (max)
            opt["max"] = max;
        if (time)
            opt["time"] = time;
        return opt;
    };
    const collector = message.channel.createMessageComponentCollector(collectorOptions());
    const pageTravelling = new Set();
    const numberTravel = async () => {
        message.delete()
    };
    collector.on("collect", async (interaction) => {
        const id = interaction.customId;
        if (id === "first")
            currentPage = 1;
        if (id === "previous")
            currentPage--;
        if (id === "number")
            await numberTravel();
        if (id === "next")
            currentPage++;
        if (id === "last")
            currentPage = embeds.length;
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
exports.pagination = pagination;
//# sourceMappingURL=pagination.js.map