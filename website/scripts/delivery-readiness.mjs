// Offline configuration check: never sends a notification or prints secret values.
import { deliveryForEnvironment } from "./production-server.mjs";
import { whatsappConfigurationReady } from "./whatsapp-notification.mjs";

console.log(
  JSON.stringify(
    {
      accountConfigurationComplete: whatsappConfigurationReady(),
      privateStorageAndOriginConfigured: deliveryForEnvironment({
        ...process.env,
        LUXE_ENQUIRY_DELIVERY_ENABLED: "true",
      }).status().enabled,
      automaticDeliveryEnabled: deliveryForEnvironment().status().enabled,
      externalRequestMade: false,
    },
    null,
    2,
  ),
);
