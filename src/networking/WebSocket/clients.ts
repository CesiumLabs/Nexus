import Collection from "@discordjs/collection";
import { Client } from "../../audio/Client";

const clientsCollection = new Collection<string, Client>();
export default clientsCollection;
