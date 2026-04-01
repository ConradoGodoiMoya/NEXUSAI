from abc import ABC, abstractmethod


class BaseConnector(ABC):
    source_name = "base"

    @abstractmethod
    def fetch(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def scan(self, local_path: str) -> list[dict]:
        raise NotImplementedError