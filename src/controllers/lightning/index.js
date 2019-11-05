module.exports = {
    getChannels(channelsList) {
        let channelsProperties = [];
        channelsList
            .filter(channel => !channel.is_private)
            .map(channel => {
                const newProperties = (({
                    id,
                    capacity,
                    is_active,
                    local_balance,
                    remote_balance,
                    partner_public_key
                }) => ({
                    id,
                    capacity,
                    is_active,
                    local_balance,
                    remote_balance,
                    partner_public_key
                }))(channel);
                channelsProperties.push(newProperties);
            });
        return channelsProperties;
    }
};
