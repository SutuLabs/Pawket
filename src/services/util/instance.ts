import { ModuleInstance } from "@chiamine/bls-signatures";
import loadBls from "@chiamine/bls-signatures";
import * as clvm_tools from "clvm_tools";

class InstanceSingleton {
  private static _instance: InstanceSingleton = new InstanceSingleton();

  BLS?: ModuleInstance;

  constructor() {
    if (InstanceSingleton._instance) {
      throw new Error("Error: Instantiation failed: Use InstanceSingleton.getInstance() instead of new.");
    }
    InstanceSingleton._instance = this;
  }

  public static getInstance(): InstanceSingleton {
    return InstanceSingleton._instance;
  }

  public async init(): Promise<void> {
    this.BLS = await loadBls();
    await clvm_tools.initialize();
  }
}

export const Instance = InstanceSingleton.getInstance();