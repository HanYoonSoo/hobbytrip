package capstone.communityservice.domain.server.repository;

import capstone.communityservice.domain.server.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerRepository extends JpaRepository<Server, Long> {
}
